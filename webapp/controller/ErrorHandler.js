sap.ui.define([
	"sap/ui/base/Object",
	"../util/messages"
], function (UI5Object, Messages) {
	"use strict";

	return UI5Object.extend("Signature.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.UIComponent} oComponent reference to the app's component
		 * @public
		 * @alias Signature.controller.ErrorHandler
		 */
		constructor: function (oComponent) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oComponent = oComponent;
			this._oModel = oComponent.getModel();
			this._sErrorText = this._oResourceBundle.getText("errorText");

			// create a message manager and register the message model
			this._oMessageManager = sap.ui.getCore().getMessageManager();
			this._oProcessor = this._oMessageManager.getMessageModel();

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				this._showServiceError(oParams.getResponse || oParams);
			}.bind(this), this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if ((oParams.response.statusCode !== "404" && oParams.response.statusCode !== "400") || 
					(oParams.response.statusCode !== 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
					this._showServiceError(oParams.response || oParams);
				}
			}.bind(this), this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be display.
		 * @param {string} sDetails a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (oError) {
			var sDetails = Messages.getErrorDetails(oError);
			Messages.popoverTechnicalMessage(oError.message,  // Messages.getErrorContent(oParameter),
				sDetails,
				oError.responseText || "",
				sap.ui.core.MessageType.Error,
				null,
				this);
		}

	});

});