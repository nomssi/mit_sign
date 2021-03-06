sap.ui.define([
	"sap/m/MessageBox",
	"sap/ui/core/message/Message",
	"sap/ui/model/json/JSONModel",
	"sap/m/Link",
	"./controls"
], function (MessageBox, Message, JSONModel, Link, controls) {
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
		var oError = {
				sDetails: "",
				sMessage: ""
			},
			oParameters = null,
			oResponse = null;
		try {
			// "getParameters": for the case of catching oDataModel "requestFailed" event
			oParameters = oParameter.getParameters ? oParameter.getParameters() : null;
			// "oParameters.response": V2 interface, response object is under the getParameters()
			// "oParameters": V1 interface, response is directly in the getParameters()
			// "oParameter" for the case of catching request "onError" event
			oResponse = oParameters ? (oParameters.response || oParameters) : oParameter;
			oError.sDetails = oResponse.responseText || oResponse.body || (oResponse.response && oResponse.response.body) || ""; //"onError" Event: V1 uses response and response.body
			oError.sMessage = fnExtractErrorMessageFromDetails(oError.sDetails) || oResponse.message || (oParameters && oParameters.message);

		} catch (e) {
			// Anweisungen für jeden Fehler
		}
		return oError;
	}

	return {
		// Show an error dialog with information from the oData response object.
		// oParameter - The object containing error information
		showErrorMessage: function (oParameter, fnOnClose) {
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

		getErrorContent: function (oParameter) {
			return fnParseError(oParameter).sMessage;
		},

		getErrorDetails: function (oParameter) {
			return fnParseError(oParameter).sDetails;
		},

		extractErrorMessageFromDetails: function (sDetails) {
			return fnExtractErrorMessageFromDetails(sDetails);
		},

		// createDefaultLink: function () {
		// 	return new Link({
		// 		text: "Allgemeine Informationen anzeigen",
		// 		href: "https://eins.de",
		// 		target: "_blank"
		// 	});
		// },

		popoverMessage: function (sMessage, sText, sType, sTarget, oControl) {
			oControl._oMessageManager.addMessages(
				new Message({
					message: sMessage,
					type: sType,
					description: sText,
					additionalText: sText,
					target: sTarget,
					processor: oControl._oProcessor
				})
			);
		},

		popoverHelpMessage: function (sMessage, oDetails, sTarget, oControl) {
			var oi18nModel = sap.ui.getCore().getModel("i18n");
			var sTitle = oi18nModel ? oi18nModel.getResourceBundle().getText("step.save") : "Fehler beim Speichern";
			var sHelpDescription = "<h2>" + sTitle + "</h2>" +
				"<p>Der unterschriebene Beleg wurde nicht oder nicht vollständig bearbeitet.</p>" +
				"<ul>" +
				"	<li>Kein E-Mail-Empfänger: Beleg wurde möglicherweise erzeugt und konnte nicht versendet werden.</li>" +
				"	<li>Einstellungen: Die E-Mail vom Empfänger ist möglicherweise nicht freigegeben.</li>" +
				"</ul>" +
				"<ol>" +
				"	<li>Wenn der Beleg nicht mehr in der <a href=\"#\">Liste</a> erscheint, gilt er als  verarbeitet.</li>" +
				"	<li>Mit Transaktion VL71 können Sie die Nachricht ZLD0 selektieren und den Beleg drucken</li>" +
				"</ol>";

			oControl._oMessageManager.addMessages(
				new Message({
					message: "Fehler in der Lieferschein-Verarbeitung " + sMessage,
					type: sap.ui.core.MessageType.Information,
					active: true,
					description: sHelpDescription,
					activeTitle: "Hinweise",
					additionalText: "Wie weiter verfahen?",
					target: sTarget,
					processor: oControl._oProcessor
				})
			);

		},

		popoverTechnicalMessage: function (sMessage, sText, sDetails, sType, sTarget, oControl) {
			if (oControl && oControl._oMessageManager) {
				oControl._oMessageManager.addMessages(
					new Message({
						message: sMessage,
						type: sType,
						description: sText,
						technicalDetails: sDetails,
						technical: true,
						additionalText: sText,
						target: sTarget,
						processor: oControl._oProcessor
					})
				);
			};
		}

	};
});