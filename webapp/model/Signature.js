// Helper class for centrally handling oData CRUD and function import services. 
// The interface provides the business meanings for the application and can be reused in different places 
// where the UI-specific actions after the call could still be different and will be handled in the 
// corresponding controller of the view.
// Every (main) view of this app has an instance of this class as an attribute so that it can forward 
// all explicit backend calls to it.
// Note that this class forwards all delete operations to helper class 
// nw.epm.refapps.products.manage.model.RemoveService, which is instantiated on demand.
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"../util/messages"
], function (Object, JSONModel, MessageToast, messages) {
	"use strict";

	return Object.extend("Signature.model.Signature", {
		constructor: function (oComponent, oMainView) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oODataModel = oComponent.getModel();
			
			this._oMainView = oMainView;
			this._oWhenNoDraft = new Promise(function (fnResolve) {
				fnResolve(); // Since we are currently not in the process of deleting a draft, the Promise is resolved immediately
			});
			//this._fnSetBackBusyDraftState = this._oApplicationProperties.setProperty.bind(this._oApplicationProperties, "/isBusyCreatingDraft",false);

		},
		getPathForSignature: function (sVbeln) {
			return this._oODataModel.createKey("/Event", {
				VBELN: sVbeln
			});
		},
		// This method checks whether the user currently possesses a draft.
		// fnHandleDraftId is called when this information has been retrieved.
		// When a draft was found the id of the draft and the whole draft object are
		// transferred as parameters to fnHandleDraft. Otherwise fnHandleDraft is called
		// with faulty parameters.
		readSignature: function (sVbeln, fnHandleDraft, fnError) {
			var fnSuccess = function (oResponseContent) {
				if (oResponseContent.results === 0) {
					this._createSignature(sVbeln, fnHandleDraft);
				} else {
					var oSig = oResponseContent.results[0];
					//var sDraftId = oProductDraft && oProductDraft.Id;
					MessageToast.show("Signatur geladen");
					fnHandleDraft(oSig);
				}
			};
			this._oODataModel.read("/LiefSIG", {
				Id: sVbeln,
				success: fnSuccess.bind(this),
				error: fnError
			});
		},

		// This method checks whether the user currently possesses a draft.
		// fnHandleDraftId is called when this information has been retrieved.
		// When a draft was found the id of the draft and the whole draft object are
		// transferred as parameters to fnHandleDraft. Otherwise fnHandleDraft is called
		// with faulty parameters.
		readEvent: function (sVbeln, fnHandleDraft, fnError) {
			var fnSuccess = function (oResponseContent) {
				if (oResponseContent.results === 0) {
					MessageToast.show("nix gefunden");
				} else {
					var oSig = oResponseContent.results[0];
					//var sDraftId = oProductDraft && oProductDraft.Id;
					MessageToast.show("Signatur geladen");
					fnHandleDraft(oSig);
				}
			};
			this._oODataModel.read("/Head", {
				VBELN: sVbeln,
				success: fnSuccess,
				error: fnError
			});
			this._oODataModel.read("/PositionSet", {
				VBELN: sVbeln,
				success: fnSuccess,
				error: fnError
			});
		},

		// externer Aufruf Entwurf anlegen
		createSignature: function (sVbeln, fnDraftCreated) {
			//this._oApplicationProperties.setProperty("/isBusyCreatingDraft", true);
			//prüfen, ob es bereits einen Entwurf gibt
			this.readSignature(sVbeln, fnDraftCreated, this._createDraft);
		},

		_createSignature: function (sVbeln, fnDraftCreated) {
			// At least one attribute must be filled in the object passed to the create call (requirement of the oData service)
			var oNew = {
				Vbeln: sVbeln
			};
			this._oODataModel.create("/Signatures", oNew, {
				success: fnDraftCreated,
				error: this._getErrorForProcessing("isBusyCreatingDraft")
			});
		},

        _getSignData: function (oModel) {
			var data = {
				Vbeln: oModel.getProperty("/Vbeln"),
				Lager: oModel.getProperty("/Releaser>Name"),			// Klartext Name Lager
				Abholer: oModel.getProperty("/Receiver>Name"),			// Klartext Name Abholer
				Sign_Lager: oModel.getProperty("/Releaser>Url"),		// Signatur Lager
				Sign_Abholer: oModel.getProperty("/Receiver>Url")		// Signatur Lager
			};
        	return data;
        },

        _isValidData: function (oData) {
			return (typeof oData.Lager !== "undefined" && typeof oData.Abholer !== "undefined" &&
				typeof oData.Sign_Lager !== "undefined" && typeof oData.Sign_Abholer !== "undefined");
        },
        
		// Saves ProductDraft each time a user edits a field
		saveSignature: function (fnAfterSaved, fnSaveFailed, oModel) {
			var oSignData = this._getSignData(oModel);
			if (this._isValidData(oSignData)) {
				this._callFunctionImport("/SaveSignature", oSignData, fnAfterSaved, fnSaveFailed);
				this._submitChanges(fnSaveFailed, fnAfterSaved);
			}
			else {
				this._submitChanges(null, null);
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
		},

		clearSignature: function (sVbeln) {
			var data = {
				Vbeln: sVbeln
			};
			var fnError = function (oError) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);
				MessageToast.show(oError);
			};
			this._callFunctionImport("/ClearSignature", data, null, fnError);
		}

	});
});