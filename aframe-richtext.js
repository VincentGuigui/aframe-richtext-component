/* A-Frame Rich Text Component v1.0.0
   aframe-richtext.js
   Inspired by https://github.com/brianpeiris/aframe-markdown
*/
(function e(t, n, r) { function s(o, u) { if (!n[o]) { if (!t[o]) { var a = typeof require == "function" && require; if (!u && a) return a(o, !0); if (i) return i(o, !0); var f = new Error("Cannot find module '" + o + "'"); throw f.code = "MODULE_NOT_FOUND", f } var l = n[o] = { exports: {} }; t[o][0].call(l.exports, function (e) { var n = t[o][1][e]; return s(n ? n : e) }, l, l.exports, e, t, n, r) } return n[o].exports } var i = typeof require == "function" && require; for (var o = 0; o < r.length; o++)s(r[o]); return s })({
  1: [function (_dereq_, module, exports) {
    'use strict';


    AFRAME.registerSystem("richtext", {
      schema: {
        normalFont: { type: "string" },
        boldFont: { type: "string" }
      },
      init() {
        const style = document.createElement('style');
        style.textContent = `
      @font-face {
        font-family: "Roboto";
        src: 
          url("${this.data.normalFont.replace("-msdf.json", ".ttf")}"),
          url("${this.data.boldFont.replace("-msdf.json", ".ttf")}");
      }
    `;
        document.head.prepend(style);
      }
    });

    AFRAME.registerComponent("richtext", {
      schema: {
        src: { type: "string" },
        wrapCount: { type: "number", default: 40 },
        padding: { type: "number", default: 0.05 }
      },
      init() {
        this.container = document.createElement("a-entity");
        this.el.appendChild(this.container);
      },
      _render(node, rootRect, scaleFactor) {
        // Note: There are lots of magic numbers here. These will probably only work will for the default Roboto font.
        // In theory you could calculate all the adjustments correctly based off the actual text metrics instead.
        switch (node.nodeName) {
          case "LI":
            const liRect = node.getClientRects()[0];
            const style = window.getComputedStyle(node);
            if (style.listStyleType === "decimal") {
              const numEl = document.createElement("a-text");

              const start = node.parentNode.start;
              let nodeIndex = 0;
              for (const childNode of node.parentNode.childNodes) {
                if (childNode.nodeName === "LI") nodeIndex++;
                if (childNode === node) break;
              }
              numEl.setAttribute("value", start + nodeIndex - 1 + ".");

              numEl.setAttribute("color", "black");
              numEl.setAttribute("font", this.system.data.normalFont);
              numEl.setAttribute("align", "right");

              const fontSize = parseFloat(style.fontSize) / scaleFactor * 4.44;
              numEl.setAttribute("scale", { x: fontSize, y: fontSize, z: fontSize });

              numEl.setAttribute("position", {
                x: liRect.left / scaleFactor - rootRect.left / scaleFactor,
                y: -liRect.top / scaleFactor + rootRect.top / scaleFactor - fontSize / 16
              });

              this.container.appendChild(numEl);
            } else {
              const circleEl = document.createElement("a-circle");
              circleEl.setAttribute("segments", 8);
              circleEl.setAttribute("radius", 0.008);
              circleEl.setAttribute("color", "black");

              const fontSize = parseFloat(style.fontSize) / scaleFactor * 25;
              circleEl.setAttribute("scale", { x: fontSize, y: fontSize, z: fontSize });

              circleEl.setAttribute("position", {
                x: liRect.left / scaleFactor - rootRect.left / scaleFactor - fontSize / 50,
                y: -liRect.top / scaleFactor + rootRect.top / scaleFactor - fontSize / 70
              });

              this.container.appendChild(circleEl);
            }
            break;
          case "#text":
            const textEl = document.createElement("a-entity");
            const rect = node.parentNode.getClientRects()[0];
            const wrapCountDecrease = (rect.left * 20 - rootRect.left * 20);
            const computedStyle = window.getComputedStyle(node.parentNode);
            let bold = computedStyle.fontWeight >= 700 || ["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.parentNode.nodeName);

            const fontSize = parseFloat(computedStyle.fontSize) / 8.5;
            textEl.setAttribute("text", {
              font: bold ? this.system.data.boldFont : this.system.data.normalFont,
              negate: !bold,
              value: node.textContent.replace(/\n/g, ''),
              anchor: 'left', baseline: 'top', color: computedStyle.color,
              width: fontSize,
              // wrapCount: this.data.wrapCount - wrapCountDecrease
            });
            textEl.setAttribute("scale", { x: fontSize, y: fontSize, z: fontSize });
            let x = rect.left - rootRect.left;
            let y = -(rect.top - rootRect.top);
            // console.log(node.textContent, x, y);
            if (node.previousSibling) {
              const sibRect = node.previousSibling.getClientRects()[0];
              if (node.previousSibling.nodeName === "BR") {
                y = -(sibRect.top - rootRect.top + sibRect.height);
              }
              else {
                const prevComputedStyle = window.getComputedStyle(node.previousSibling);
                let prevBold = prevComputedStyle.fontWeight >= 700 || ["H1", "H2", "H3", "H4", "H5", "H6"].includes(node.parentNode.nodeName);
                x = (sibRect.left - rootRect.left + sibRect.width) + 3 + (prevBold ? -2 : 0); /* space after previous sibling */
                y = -(sibRect.top - rootRect.top);
              }
            }
            // } else {
            //   y = 0 * -rect.top;
            // }
            // y = y / scaleFactor;
            // let nodeRect = node.getClientRects();
            // if (nodeRect)
            //   nodeRect = nodeRect[0]
            // else {
            //   const range = document.createRange();
            //   range.selectNodeContents(node);
            //   nodeRect = range.getClientRects();
            // }
            // if (nodeRect)
            textEl.setAttribute("position", { x: x / scaleFactor, y: y / scaleFactor });

            this.container.appendChild(textEl);
            break;
          case "IMG":
            if (node.naturalWidth === 0) return;
            const imgEl = document.createElement("a-image");
            const imgRect = node.getClientRects()[0];
            imgEl.setAttribute("src", node.src);
            imgEl.setAttribute("side", "front");
            imgEl.setAttribute("scale", {
              x: imgRect.width / scaleFactor,
              y: imgRect.height / scaleFactor
            });
            imgEl.setAttribute("position", {
              x: imgRect.width / scaleFactor / 2,
              y: -imgRect.top / scaleFactor - imgRect.height / scaleFactor / 2
            });
            this.container.appendChild(imgEl);
            break;
        }
      },
      _traverse(node, rootRect, scaleFactor) {
        this._render(node, rootRect, scaleFactor);
        for (const child of node.childNodes) {
          this._traverse(child, rootRect, scaleFactor);
        }
      },
      async update() {

        let node;
        try {
          node = document.querySelector(this.data.src);
        } catch (e) { }
        const src = node ? node.data : this.data.src;
        node.style.fontFamily = "Roboto, sans-serif";
        // this.renderedHtml.style.width = `${this.data.wrapCount * 45.3 / 80}em`;

        const imagePromises = [];
        node.querySelectorAll("img").forEach(img => {
          if (img.complete) return;
          imagePromises.push(new Promise((resolve, reject) => {
            img.addEventListener("load", resolve);
            img.addEventListener("error", () => {
              console.warn(`RichText: Image failed to load - ${img.src}`);
              resolve();
            });
          }));
        });
        await Promise.all(imagePromises);

        this.container.innerHTML = '';
        const scaleFactor = 100;
        const rootRect = node.getClientRects()[0];
        this.container.object3D.position.set(-rootRect.width / scaleFactor / 2, rootRect.height / scaleFactor / 2, 0);
        this._traverse(node, rootRect, scaleFactor);

        rootRect.x = rootRect.left / scaleFactor;
        rootRect.y = rootRect.top / scaleFactor;
        rootRect.width = rootRect.width / scaleFactor;
        rootRect.height = rootRect.height / scaleFactor;
        const background = document.createElement('a-plane');
        background.setAttribute('position', `${rootRect.width / 2} ${-rootRect.height / 2} -0.001`);
        background.setAttribute('scale', `${rootRect.width + this.data.padding} ${rootRect.height + this.data.padding} 1`);
        background.setAttribute('color', 'red');
        background.setAttribute('side', 'double');
        this.container.appendChild(background);

        this.container.emit("rendered");
      }
    });

  }], 3: [function (_dereq_, module, exports) {
    module.exports = { "name": "aframe-richtext", "version": "1.0.0" }
  }, {}]
}, {}, [1]);