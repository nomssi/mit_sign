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

		formatObject: function (sFloeId, bSaved, bActive, bEmailValid) {
			var oEvent = {
				floeId: sFloeId,
				saved: bSaved,
				active: bActive,
				emailValid: bEmailValid
			};
			var oState = {
				text: "",
				icon: "sap-icon://status-error",
				marker: ""
			};
			var bemailSent = (oEvent.floeId && oEvent.floeId !== "0000000000");
			if (oEvent.active) {
				if (oEvent.saved) {
					if (oEvent.emailValid) {
						if (bemailSent) {
							oState.text = "versendet, Vorgang abgebrochen";
							oState.icon = "sap-icon://warning";
						} else {
							oState.text = "Vorgang abgebrochen";
							oState.icon = "sap-icon://status-in-process";
						}
					} else {
						if (bemailSent) {
							oState.text = "versendet, Empfänger E-Mail fehlt";
							oState.icon = "sap-icon://status-error";
						} else {
							oState.text = "Empfänger E-Mail fehlt";
							oState.icon = "sap-icon://status-in-process";
						}
					};
				} else {
					if (oEvent.emailValid) {
						oState.text = "";
						oState.icon = "sap-icon://start-event";
					} else {
						oState.text = "Empfänger E-Mail fehlt";
						oState.icon = "sap-icon://error-start-event";
					};
				}
			} else {
				if (oEvent.saved) {
					if (bemailSent) {
						oState.text = "versendet";
						oState.icon = "sap-icon://completed";
					} else {
						if (oEvent.emailValid) {
							oState.text = "nicht versendet";
							oState.icon = "sap-icon://sys-cancel";
						} else {
							oState.text = "Empfänger E-Mail fehlt";
							oState.icon = "sap-icon://sys-error";
						}
					};
				} else {
					oState.text = "interner Fehler";
					oState.icon = "sap-icon://sys-error";
				}
			};
			return oState.text;
		},

		formatState: function (sFloeId, bSaved, bActive, bEmailValid) {
			var sState;

			if (bActive) {
				if (bEmailValid) {
					sState = "None";
				} else {
					sState = "Error"; // to be reviewed, but eMail missing
				};
			} else {
				if (sFloeId && sFloeId !== "0000000000") {
					sState = "Success";
				} else {
					sState = "Warning";
				};
			};
			return sState;
		}

	};

	return formatter;
});