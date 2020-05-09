sap.ui.define([
	"sap/ui/core/UIComponent",
	"./model/models",
	"./controller/ErrorHandler",
	"./util/controls",
	"sap/m/MessageBox"
], function (UIComponent, models, ErrorHandler, controls, MessageBox) {
	"use strict";

	return UIComponent.extend("Signature.Component", {

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

			// aus der manifest.json unter models
			/*	"": {
				"dataSource": "mainService",
				"preload": true,
				...
				
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

			this._oErrorHandler = new ErrorHandler(this);

			// enable routing
			var oRouter = this.getRouter();
			if (oRouter) {
				oRouter.initialize();
				oRouter.getTargetHandler().setCloseDialogs(false);	// Add. Features: Error Handling
			}

			// update browser title
			/* this.getRouter().attachTitleChanged(function(oEvent) {
				var sTitle = oEvent.getParameter("title");
				document.addEventListener('DOMContentLoaded', function(){
					document.title = sTitle;
				});
			});*/
		},

		destroy: function () {
			this._oErrorHandler.destroy();
			// call the base component's destroy function
			UIComponent.prototype.destroy.apply(this, arguments);
		},

		_showServiceError: function (sDetails) {
			if (this._bMessageOpen) {
				return;
			};
			this._bMessageOpen = true;
			MessageBox.error("Fehler / An Error occured",
			{
				details: sDetails,
				actions: [MessageBox.Action.CLOSE],
				onClose: function () {
					this._bMessageOpen = false;
				}.bind(this)
			});
		},

		/**
		 * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
		 * design mode class should be set, which influences the size appearance of some controls.
		 * @public
		 * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
		 */
		getContentDensityClass: function () {
			// check whether FLP has already set the content density class; do nothing in this case
			if (typeof this._sContentDensityClass === "undefined") {
				this._sContentDensityClass = controls.getContentDensityClass();
			}
			return this._sContentDensityClass;
		}
	});
});