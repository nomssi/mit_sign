// Helper class for centrally handling oData CRUD and function import services. 
// client views have an instance of this class as an attribute. They forward explicit backend calls to it.
sap.ui.define([
	"sap/ui/base/Object",
	"../util/messages"
], function (Object, messages) {
	"use strict";

	return Object.extend("Signature.model.Signature", {
		constructor: function (oComponent) {
			this._oODataModel = oComponent.getModel();
		},

		// Saves Draft 
		saveSignature: function (fnAfterSaved, fnSaveFailed, oSignData) {
			if (typeof oSignData === "undefined") {
				this._submitChanges(null, null);
			} else {
				this._callFunctionImport("/SaveSignature", oSignData, fnAfterSaved, fnSaveFailed);
				this._submitChanges(fnSaveFailed, fnAfterSaved);
			};
		},

		_submitChanges: function (fnSaveFailed, fnAfterSaved) {
			if (this._bIsChanging) {
				return;
			}
			if (this._oODataModel.hasPendingChanges()) {
				this._sMessage = null;
				var fnSuccess = function (oResponseData) {
					this._bIsChanging = false;

					if (!this._oODataModel.hasPendingChanges() || !this._sMessage) {

						if (typeof oResponseData.__batchResponses === "undefined") {
							return;
						} else {
							for (var i = 0; i < oResponseData.__batchResponses.length && !this._sMessage; i += 1) {
								var oEntry = oResponseData.__batchResponses[i];
								if (oEntry.response) {
									this._sMessage = messages.extractErrorMessageFromDetails(oEntry.response.body);
								}
							}
						}

					}
					if (this._sMessage) {
						fnAfterSaved(this._sMessage);
					} else {
						this._submitChanges(fnSaveFailed, fnAfterSaved); // Loop
					}
				};
				this._bIsChanging = true;
				var oParameters = {
					success: fnSuccess.bind(this),
					error: fnSaveFailed,
					batchGroupId: "editsignature"
				};
				this._oODataModel.submitChanges(oParameters);
			}
		},

		_callFunctionImport: function (sFunctionName, oURLParameters, fnAfterFunctionExecuted, fnExecutionError) {
			this._oODataModel.callFunction(sFunctionName, {
				method: "POST",
				urlParameters: oURLParameters,
				success: fnAfterFunctionExecuted,
				error: fnExecutionError
			});
		}

	});
});