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

		formatEmail: function (sFloeId) {
			if (sFloeId && sFloeId !== "0000000000") {
				return sFloeId;
			};
			return "";
		},

		formatMarker: function (sFloeId, sSaved) {
			var sMarker;
			if (sFloeId && sFloeId !== "0000000000") {
				sMarker = "Flagged";
			} else {
				if (sSaved) {
					sMarker = "Draft";
				} else {
					sMarker = "Favorite";
				};
			};
			return sMarker;
		},

		formatState: function (sFloeId, sSaved) {
			var sState;
			if (sFloeId && sFloeId !== "0000000000") {
				sState = "Success";
			} else if (sSaved) {
				sState ="Warning";
			} else {
				sState = "None";
			};
			return sState;
		}

	};

	return formatter;
});