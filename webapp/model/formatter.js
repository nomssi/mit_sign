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
				text: ""
			};
			var bemailSent = (oEvent.floeId && oEvent.floeId !== "0000000000");
			if (oEvent.active) {
				if (oEvent.saved) {
					if (oEvent.emailValid) {
						if (bemailSent) {
							oState.text = "versendet, Vorgang abgebrochen";
						} else {
							oState.text = "Vorgang abgebrochen";
						}
					} else {
						if (bemailSent) {
							oState.text = "versendet, Empfänger E-Mail fehlt";
						} else {
							oState.text = "Empfänger E-Mail fehlt";
						}
					};
				} else {
					if (oEvent.emailValid) {
						oState.text = "";
					} else {
						oState.text = "Empfänger E-Mail fehlt";
					};
				}
			} else {
				if (oEvent.saved) {
					if (bemailSent) {
						oState.text = "versendet";
					} else {
						if (oEvent.emailValid) {
							oState.text = "nicht versendet";
						} else {
							oState.text = "Empfänger E-Mail fehlt";
						}
					};
				} else {
					oState.text = "interner Fehler";
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
		},

		// Display the button type according to the message with the highest severity
		// The priority of the message types are as follows: Error > Warning > Success > Info
		// var aMessages = this._oProcessor.oData;
		buttonTypeFormatter: function () {
			var sHighestSeverity = "Emphasized";

			var aMessages = this._oProcessor.oData;
			aMessages.forEach(function (sMessage) {
				switch (sMessage.type) {
				case "Error":
					sHighestSeverity = "Negative";
					break;
				case "Warning":
					sHighestSeverity = sHighestSeverity === "Negative" ? sHighestSeverity : "Critical";
					break;
				case "Success":
					sHighestSeverity = sHighestSeverity === "Negative" || sHighestSeverity === "Critical" ? sHighestSeverity : "Success";
					break;
				default:
					sHighestSeverity = sHighestSeverity ? sHighestSeverity : "Neutral";
					break;
				}
			});

			return sHighestSeverity;
		},

		// Set the button icon according to the message with the highest severity
		// var aMessages = this._oProcessor.oData;
		buttonIconFormatter: function () {
			var sIcon = "sap-icon://message-popup";

			var aMessages = this._oProcessor.oData;
			aMessages.forEach(function (sMessage) {
				switch (sMessage.type) {
				case "Error":
					sIcon = "sap-icon://message-error";
					break;
				case "Warning":
					sIcon = sIcon === "sap-icon://message-error" ? sIcon : "sap-icon://message-warning";
					break;
				case "Success":
					sIcon = "sap-icon://message-error" && sIcon === "sap-icon://message-warning" ? sIcon : "sap-icon://message-success";
					break;
				default:
					sIcon = sIcon ? sIcon : "sap-icon://message-information";
					break;
				}
			});

			return sIcon;
		}

	};

	return formatter;
});