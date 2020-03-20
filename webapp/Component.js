sap.ui.define([
	"sap/ui/core/UIComponent",
	"./model/models",
	"sap/ui/Device",
	"./controller/ErrorHandler"
], function(UIComponent, models, Device, ErrorHandler) {
	"use strict";

	return UIComponent.extend("mit_sign.Component", {

		metadata: {
			manifest: "json"
		},

		/**
		 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
		 * In this function, the device models are set and the router is initialized.
		 * @public
		 * @override
		 */
		init: function () {

			this._oErrorHandler = new ErrorHandler(this);
			
			//aus der manifest.json unter models
			/*	"": {
				"dataSource": "mainService",
				"preload": true,
				"metadataUrlParams": {
						"sap-documentation": "heading"
					},
					"json": true,
					"defaultBindingMode": "TwoWay",
					"useBatch": true,
					"defaultCountMode": "Inline",
					"loadMetadataAsync": true
			}*/
			
			var oModel = models.createODataModel({
				urlParametersForEveryRequest: [
						"sap-server",
						"sap-client",
						"sap-language"
					],
				url: this.getManifestEntry("/sap.app/dataSources/mainService/uri"),
				config: {
					metadataUrlParams: {
						"sap-documentation": "heading"
					},
					json: true,
					defaultBindingMode: "TwoWay",
					useBatch: true,
					defaultCountMode: "Inline",
					loadMetadataAsync: true
				}
			});
			
			oModel.setDeferredBatchGroups(["editsignature", "BatchDelete"]);
			oModel.setChangeBatchGroups({
				"Signature": {
					batchGroupId: "editsignature"
				}
			});
			
			this.setModel(oModel);
			
			// set the device model
			this.setModel(models.createDeviceModel(), "device");

			// call the base component's init function and create the App view
			UIComponent.prototype.init.apply(this, arguments);

			// enable routing
			var oRouter = this.getRouter();
			if (oRouter) {
				oRouter.initialize();
			}

			// update browser title
			/*this.getRouter().attachTitleChanged(function(oEvent) {
				var sTitle = oEvent.getParameter("title");
				document.addEventListener('DOMContentLoaded', function(){
					document.title = sTitle;
				});
			});*/
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass : function() {
			if (this._sContentDensityClass === undefined) {
				// check whether FLP has already set the content density class; do nothing in this case
				// eslint-disable-next-line sap-no-proprietary-browser-api
				if (document.body.classList.contains("sapUiSizeCozy") || document.body.classList.contains("sapUiSizeCompact")) {
					this._sContentDensityClass = "";
				} else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
					this._sContentDensityClass = "sapUiSizeCompact";
				} else {
					// "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
					this._sContentDensityClass = "sapUiSizeCozy";
				}
			}
			return this._sContentDensityClass;
		}
	});
});
