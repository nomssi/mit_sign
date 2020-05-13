sap.ui.define([
		"sap/m/MessageBox",
		"sap/ui/model/json/JSONModel",
		"sap/ui/Device",	
		"sap/m/Link",
		"./controls"
	], function(MessageBox, JSONModel, Device, Link, controls) {
	"use strict";

	function fnExtractErrorMessageFromDetails(sDetails) {
		var sMessageText;
		if (jQuery.sap.startsWith(sDetails || "", "{\"error\":")) {
			var oErrModel = new JSONModel();
			oErrModel.setJSON(sDetails);
			sMessageText = oErrModel.getProperty("/error/message/value") || "Error";
		}
		return sMessageText;
	}

	function fnParseError(oParameter) {
		var oParameters = null,
			oResponse = null,
			oError = {};

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
			var oErrorDetails = fnParseError(oParameter),
				oBundle = sap.ui.getCore().getLibraryResourceBundle("nw.epm.refapps.shop.reuse");
			MessageBox.show(oErrorDetails.sMessage, {
				icon: MessageBox.Icon.ERROR,
				title: oBundle.getText("xtit.error"),
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
	       var generalInfoUrl = "https://eins.de";
	        
			return new Link({
					text: "Allgemeine Informationen anzeigen",
					href: generalInfoUrl,
					target: "_blank"
				});	
		},
		
		popoverMessage: function (sMessage, sText, sType, sTarget, that) {
			that._oMessageManager.addMessages(
				new sap.ui.core.message.Message({
					message: sMessage,
					type: sType,
					additionalText: sText,
					target: sTarget,
					processor: that._oProcessor
				})
			);
		}
	};
});