sap.ui.define([
		"sap/ui/base/Object",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"../reuse/util/messages"
	], function (UI5Object, MessageBox, MessageToast, Messages) {
		"use strict";

		return UI5Object.extend("Signature.controller.ErrorHandler", {

			/**
			 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
			 * @class
			 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
			 * @public
			 * @alias Signature.controller.ErrorHandler
			 */
			constructor : function (oComponent) {

				this._oLink = Messages.createDefaultLink();
				
				this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
				this._oComponent = oComponent;
				this._oModel = oComponent.getModel();
				this._bMessageOpen = false;
				this._sErrorText = this._oResourceBundle.getText("errorText");

				// create a message manager and register the message model
				this._oMessageManager = sap.ui.getCore().getMessageManager();
				this._oProcessor = this._oMessageManager.getMessageModel();	
				

				this._oModel.attachMetadataFailed(function (oEvent) {
					var oParams = oEvent.getParameters();

					this._showMetadataError(oParams.response);
				}, this);

				this._oModel.attachRequestFailed(function (oEvent) {
					var oParams = oEvent.getParameters();

					// An entity that was not found in the service is also throwing a 404 error in oData.
					// We already cover this case with a notFound target so we skip it here.
					// A request that cannot be sent to the server is a technical error that we have to handle though
					if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
						this._showServiceError(oParams.response);
					}
				}, this);
			},

			/**
			 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
			 * The user can try to refresh the metadata.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showMetadataError : function (sDetails) {
				MessageBox.error(
					this._sErrorText,
					{
						id : "metadataErrorMessageBox",
						details : sDetails,
						styleClass : this._oComponent.getContentDensityClass(),
						actions : [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
						onClose : function (sAction) {
							if (sAction === MessageBox.Action.RETRY) {
								this._oModel.refreshMetadata();
							}
						}.bind(this)
					}
				);
			},

			_popoverMessage: function(sMessage, sText, sType, sTarget) {
				this._oMessageManager.addMessages(
					new sap.ui.core.message.Message({
						message: sMessage,
						type: sType,
						additionalText: sText,
						target: sTarget,
						processor: this._oProcessor
					})
				);	
			},
			
			/**
			 * Shows a {@link sap.m.MessageBox} when a service call has failed.
			 * Only the first error message will be display.
			 * @param {string} sDetails a technical error to be displayed on request
			 * @private
			 */
			_showServiceError : function (sDetails) {
				if (this._bMessageOpen) {
					return;
				}
				// to suppress all message boxes, just make the ErrorHandler believe there's a message box open already
				this._bMessageOpen = true;
				
				// MessageBox.error(
				// 	this._sErrorText,
				// 	{
				// 		id : "serviceErrorMessageBox",
				// 		details : sDetails,
				// 		styleClass : this._oComponent.getContentDensityClass(),
				// 		actions : [MessageBox.Action.CLOSE],
				// 		onClose : function () {
				// 			this._bMessageOpen = false;
				// 		}.bind(this)
				// 	}
				// );
				
				// var aDetails = JSON.parse(sDetails.responseText);
				// MessageToast.show(this._sErrorText + " " + aDetails.error.message.value);
				this._popoverMessage("TEST", // this.sVbeln, 
				    		         this._sErrorText + " " + sDetails.responseText, 
				                	 sap.ui.core.MessageType.Error, 
				                	 this._oLink);
				
				// done with the special service and custom handler,  fall back on the default ErrorHandler
				this._bMessageOpen = false;				
			}

		});

	}
);
