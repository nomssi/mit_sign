sap.ui.define([
	"sap/ui/core/format/NumberFormat",
	"sap/ui/core/format/DateFormat"
], function (NumberFormat, DateFormat) {
	"use strict";

	var formatter = {
		/**
		 * Formats the quantity
		 * @param {string} sValue model quantity value
		 * @return {string} formatted quantity
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

		formatFloeId: function (sFloeId) {
			if (sFloeId && sFloeId !== "0000000000") {
				return sFloeId;
			};
			return "";
		},

		validateInput: function (sCurrentValue) {
			
			var oState = {
				valid: false,
				errorId: "",
				state: "Error"
			};

			if (sCurrentValue) {
				var isValidEntry = (/^[a-zA-ZäöüÄÖÜÀ-ÿŠŒšœžŽŸ\- ]+$/).test(sCurrentValue); // RegEx: Letters, no number, Umlaut, space, .

				if (isValidEntry) {
					oState.valid = true;
					oState.state = "None";
				} else {
					oState.errorId = "invalid.Chars";
				}
			} else {
				oState.errorId = "mandatory.field";
			};
			return oState;
		},

		formatStateText: function (sFloeId, bSaved, bActive, bEmailValid) {
			var oEvent = {
				floeId: sFloeId,
				saved: bSaved,
				active: bActive,
				emailValid: bEmailValid
			};
			
			var sState = "";
			var bemailSent = (oEvent.floeId && oEvent.floeId !== "0000000000");
			if (oEvent.active) {
				if (oEvent.saved) {
					if (oEvent.emailValid) {
						if (bemailSent) {
							sState = "os_sent_cancelled";
						} else {
							sState = "os_cancelled";
						}
					} else {
						if (bemailSent) {
							sState = "os_sent_no_recipient";
						} else {
							sState = "os_no_recipient";
						}
					};
				} else {
					if (oEvent.emailValid) {
						sState = "os_none";
					} else {
						sState = "os_no_recipient";
					};
				}
			} else {
				if (oEvent.saved) {
					if (bemailSent) {
						sState = "os_sent";
					} else {
						if (oEvent.emailValid) {
							sState = "os_not_sent";
						} else {
							sState = "os_no_recipient";
						}
					};
				} else {
					sState = "os_internal_error";
				}
			};
			
			var sText;
			switch (sState) {
			  case "os_sent_cancelled":
			    sText = "versendet, Vorgang abgebrochen";
			    break;
			  case "os_cancelled":
			    sText = "Vorgang abgebrochen";
			    break;
			  case "os_sent":
			    sText = "versendet";
			    break;
			  case "os_not_sent":
			    sText = "nicht versendet";
			    break;
			  case "os_no_recipient":
			    sText = "Empfänger E-Mail fehlt";
			    break;
			  case "os_sent_no_recipient":
			    sText = "versendet, Empfänger E-Mail fehlt";
			    break;
			  case "os_internal_error":
			    sText = "interner Fehler";
			    break;
			  case "os_none":
			    sText = "";
			    break;
			  default:
			    sText = "";
			};	
			return sText;
		},

		formatState: function (sFloeId, bActive, bEmailValid) {
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
		},
		
		formatDate: function (oDate) {
			var dateFormat = DateFormat.getDateInstance({pattern : "dd.MM.yyyy" });
			return dateFormat.format(new Date(oDate));
		}

	};

	return formatter;
});