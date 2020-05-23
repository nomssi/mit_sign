sap.ui.define([
	"sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
	"use strict";

	var formatter = {
		/**
		 * Formats the price
		 * @param {string} sValue model price value
		 * @return {string} formatted price
		 */
		float: function (sValue) {
			var numberFormat = NumberFormat.getFloatInstance({
				maxFractionDigits: 2,
				minFractionDigits: 2,
				groupingEnabled: true,
				groupingSeparator: ".",
				decimalSeparator: ","
			});
			return numberFormat.format(sValue);
		},

		/**
		 * Returns the status text based on the delivery  status
		 * @param {string} sStatus delivery  status
		 * @return {string} the corresponding text if found or the original value
		 */
		statusText: function (sStatus) {
			var oBundle = this.getResourceBundle();

			var mStatusText = {
				"0": oBundle.getText("statusNew"),
				"1": oBundle.getText("statusProcessed"),
				"2": oBundle.getText("statusError")
			};

			return mStatusText[sStatus] || sStatus;
		},

		formatFloeId: function (sFloeId) {
			if (sFloeId && sFloeId !== "0000000000") {
				return sFloeId;
			};
			return "";
		},

		formatMarker: function (sFloeId, sSaved, sActive) {
			var sMarker;
			if (sFloeId && sFloeId !== "0000000000") {
				sMarker = "Favorite";
			} else {
				if (sSaved) {
					sMarker = "Locked";
				};
			};
			return sMarker;
		},

		formatState: function (sFloeId, bSaved, bActive, bEmailValid) {
			var sState;

			if (bActive) {
				if (bEmailValid) {
					sState = "None";
				} else {
					sState = "Error";			// to be reviewed, but eMail missing
				};
			} else {
				if (sFloeId && sFloeId !== "0000000000") {
					sState = "Success";
				} else {
					sState = "Warning";
				};
			};
			return sState;
		},
		
		formatStateText: function (sFloeId, bSaved, bActive, bEmailValid) {
			var sText = "sap-icon://status-error";
			if (bActive) {
				if (bEmailValid) {
					sText = "zu unterschreiben";
				} else {
					sText = "Empfänger E-Mail fehlt";
				};
			} else {
				if (sFloeId && sFloeId !== "0000000000") {
					sText = "abgeschlossen";
				} else {
					if (bEmailValid) {
						sText = "gesichert, nicht versandt";
					} else {
						sText = "gesichert, Empfänger E-Mail fehlt";
					}
				};
			};
			return sText;
		}
				
	};

	return formatter;
});