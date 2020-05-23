sap.ui.define([
		"sap/m/MessageBox",
		"sap/ui/core/message/Message",
		"sap/ui/model/json/JSONModel",
		"sap/m/Link",
		"./controls"
	], function(MessageBox, Message, JSONModel, Link, controls) {
	"use strict";

	function fnExtractErrorMessageFromDetails(sDetails) {
		var sMessageText = "";
		if (jQuery.sap.startsWith(sDetails || "", "{\"error\":")) {
			var oErrModel = new JSONModel();
			oErrModel.setJSON(sDetails);
			sMessageText = oErrModel.getProperty("/error/message/value") || "Error";
		}
		return sMessageText;
	}

	function fnParseError(oParameter) {
		var oError = {},
			oParameters = null,
			oResponse = null;

		// "getParameters": for the case of catching oDataModel "requestFailed" event
		oParameters = oParameter.getParameters ? oParameter.getParameters() : null;
		// "oParameters.response": V2 interface, response object is under the getParameters()
		// "oParameters": V1 interface, response is directly in the getParameters()
		// "oParameter" for the case of catching request "onError" event
		oResponse = oParameters ? (oParameters.response || oParameters) : oParameter;
		oError.sDetails = oResponse.responseText || oResponse.body || (oResponse.response && oResponse.response.body) || ""; //"onError" Event: V1 uses response and response.body
		oError.sMessage = fnExtractErrorMessageFromDetails(oError.sDetails) || oResponse.message || (oParameters && oParameters.message);
		return oError;
	}

	return {
		// Show an error dialog with information from the oData response object.
		// oParameter - The object containing error information
		showErrorMessage: function(oParameter, fnOnClose) {
			var oErrorDetails = fnParseError(oParameter);
			var oBundle = sap.ui.getCore().getModel("i18n").getResourceBundle();

			MessageBox.show(oErrorDetails.sMessage, {
				icon: MessageBox.Icon.ERROR,
				title: oBundle.getText("errorText"),
				details: oErrorDetails.sDetails,
				actions: MessageBox.Action.CLOSE,
				onClose: fnOnClose,
				styleClass: controls.getContentDensityClass()
			});
		},

		getErrorContent: function(oParameter) {
			return fnParseError(oParameter).sMessage;
		},

		getErrorDetails: function(oParameter) {
			return fnParseError(oParameter).sDetails;
		},

		extractErrorMessageFromDetails: function(sDetails) {
			return fnExtractErrorMessageFromDetails(sDetails);
		},
		
		createDefaultLink: function() {
			if (!this._oLink) {
				this._oLink = new Link({
					text: "Allgemeine Informationen anzeigen",
					href: "https://eins.de",
					target: "_blank"
				});
			};
			return this._oLink;
		},

		// Not used yet
		newPopoverMessage: function (oControl, oTarget, sType, sTitle, sDescription, sLongText, sDetails) {
			oControl._oMessageManager.addMessages(
				new Message({
					type: sType,
					message: sTitle,
					description: sDescription,
					additionalText: sLongText,
					technical: true,
					technicalDetails: sDetails,
					target: oTarget ? oTarget : this._oLink,
					processor: oControl._oProcessor
				})
			);
		},
		
		popoverMessage: function (sMessage, sText, sType, sTarget, oControl) {
			oControl._oMessageManager.addMessages(
				new Message({
					message: sMessage,
					type: sType,
					description: sText,
					additionalText: sText,
					target: sTarget ? sTarget : this._oLink,
					processor: oControl._oProcessor
				})
			);
		},
		
		popoverTechnicalMessage: function (sMessage, sText, sDetails, sType, sTarget, oControl) {
			oControl._oMessageManager.addMessages(
				new Message({
					message: sMessage,
					type: sType,
					description: sText,
					technicalDetails: sDetails,
					technical: true,
					additionalText: sText,
					target: sTarget ? sTarget : this._oLink,
					processor: oControl._oProcessor
				})
			);
		}
		
	};
});