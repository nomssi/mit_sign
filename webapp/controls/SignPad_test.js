sap.ui.define(
		["sap/ui/core/Control","sap/m/MessageBox"],
	function(Control,MessageBox) {
		"use strict";
		return Control.extend("mit_sign.controls.SignPad", {	
  metadata: {
      properties: {
    	  /* other (configuration) properties */
          "width"             : {"type" : "int", "defaultValue" : "600"},
          "height"            : {"type" : "int", "defaultValue" : "200"},

        "bgcolor": {"type": "string", "defaultValue": "#fff"},
        "lineColor": {"type": "string", "defaultValue": "#666"},
        "penColor": {"type": "string", "defaultValue": "#000"},
        "signature": "string"
      }
    },

    renderer: function(oRm, oControl) {
      var bgColor = oControl.getBgcolor();
      var lineColor = oControl.getLineColor();
      var pen = oControl.getPenColor();
      var id = oControl.getId();
      var w = oControl.getWidth();
      var h = oControl.getHeight();

      oRm.openStart("div", oControl); 
      oRm.class("sapThemeText");
      oRm.writeControlData(oControl);
      oRm.write(" style='border:1em solid #000'");
      oRm.openEnd();
      
      oRm.write('<svg xmlns="http://www.w3.org/2000/svg" width="' + w +
                '" height="' + h + '" viewBox="0 0 ' + w + " " + h + '">');

      oRm.write('<rect id="' + id  + '_r" width="' + w + '" height="' + h +
                '" fill="' + bgColor  + '"/>');

      var hh = h - 20;
      oRm.write('<line x1="0" y1="' + hh  + '" x2="' + w + '" y2="' + hh +
                '" stroke="' + lineColor +
                '" stroke-width="1" stroke-dasharray="3" ' +
                'shape-rendering="crispEdges" pointer-events="none"/>');

      oRm.write('<path id="' + id + '_p" stroke="' + pen + '" stroke-width="2" ' +
                'fill="' + pen + '" pointer-events="none"/>');
      oRm.close("svg");
      oRm.close("div");
    },

    clear: function() {
    	var that = this;
	      that.signaturePath = "";
	      var p = $("#" + that.getId() + "_p");
	      p.setAttribute("d", "");
    },


   /* save : function(oEvent){
		var canvas = document.getElementById(this.getId() + '_p');
		var link = document.createElement('a');
		link.href = canvas.toDataURL('image/jpeg');&nbsp;
		link.download = 'sign.jpeg';
		link.click();&nbsp;
	},*/

    onAfterRendering: function() {
      var that = this;
      that.signaturePath = "";
      var isDown = false;
      // var elm = that.$()[0];
      var r = $("#" + that.getId() + "_r");
      var p = $("#" + that.getId() + "_p");

      function isTouchEvent(e) {
        return e.type.match(/^touch/);
      }

      function getCoords(e) {
        if (isTouchEvent(e)) {
          return e.targetTouches[0].clientX + "," +
            e.targetTouches[0].clientY;
        }
        return e.clientX + "," + e.clientY;
      }

      function down(e) {
        that.signaturePath += "M" + getCoords(e) + " ";
        p.setAttribute("d", that.signaturePath);
        isDown = true;
        if (isTouchEvent(e)) {e.preventDefault();}
      }

      function move(e) {
        if (isDown) {
          that.signaturePath += "L" + getCoords(e) + " ";
          p.setAttribute("d", that.signaturePath);
        }
        if (isTouchEvent(e)) {e.preventDefault();}
      }

      function up(e) {
        isDown = false;
        if (isTouchEvent(e)) {e.preventDefault();}
      }

      r.addEventListener("mousedown", down, false);
      r.addEventListener("mousemove", move, false);
      r.addEventListener("mouseup", up, false);
      r.addEventListener("touchstart", down, false);
      r.addEventListener("touchmove", move, false);
      r.addEventListener("touchend", up, false);
      r.addEventListener("mouseout", up, false);
     //To get signature path&nbsp;
       if (this.getSignature()) {
        this.signaturePath = this.getSignature();
        p = $("#" + this.getId() + "_p");
        if (p) {
          p.setAttribute("d", this.signaturePath);
        }
      }
      // to set signature path to the signaturepad to display
       that.setSignature = function(s) {
        that.setProperty("signature", s);
        that.invalidate();
      };
    }
		});
		}
	);