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
				VBELN: sVbeln,
				Status: "0"
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
			}.bind(this);
			this._oODataModel.read("/LiefSIG", {
				Id: sVbeln,
				success: fnSuccess,
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
				Status: "0",
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
				Vbeln: sVbeln,
				Status: "0"
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

        _ValidData: function (oData) {
        	if (oData.sLager !== undefined && oData.sAbholer !== undefined && oData.sSign_Lager !== undefined && oData.sSign_Abholer !== undefined ) {
        		return true;
        	}
        	else {
        	  return false;	
        	};
        },
        
		// Saves ProductDraft each time a user edits a field
		saveSignature: function (sVbeln, fnAfterSaved, oModel) {
			this._submitChanges(null, null);
			//var sVbeln = Model sVbeln;
			this._callFunctionImport("/SaveSignature", this._getSignData(oModel), fnAfterSaved, "isBusySaving");
			this._submitChanges(fnAfterSaved, oModel);
		},

		updateSignature: function (fnAfterSaved, fnError, oModel) {
			var oData = this._getSignData(oModel);
			if (this._ValidData(oData)) {
				this.saveSignature(oData.Vbeln, fnAfterSaved, oModel);
			};
			this._submitChanges(fnError, fnAfterSaved);
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

						if (oResponseData.__batchResponses === undefined) {
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
				}.bind(this);
				this._bIsChanging = true;
				var oParameters = {
					success: fnSuccess,
					error: fnSaveFailed,
					batchGroupId: "editsignature"
				};
				this._oODataModel.submitChanges(oParameters);
			}
			/* else if (this.oDraftToActivate) {
							if (this._sMessage) {
								this._oApplicationProperties.setProperty("/isBusySaving", false);
							} else {
								this._callFunctionImport("/ActivateDraft", {
									UNAME: ""
								}, this.oDraftToActivate.fnAfterActivation, "isBusySaving");
							}
							this.oDraftToActivate = null;
						}*/
		},


		_callFunctionImport: function (sFunctionName, oURLParameters, fnAfterFunctionExecuted, sProcessingProperty) {
			this._oODataModel.callFunction(sFunctionName, {
				method: "POST",
				urlParameters: oURLParameters,
				success: fnAfterFunctionExecuted,
				error: this._getErrorForProcessing(sProcessingProperty)
			});
		},
		_getErrorForProcessing: function (sProcessingProperty) {
			return function (oError) {
				//this._oApplicationProperties.setProperty("/" + sProcessingProperty, false);
				// MessageToast.show(oError);
				MessageToast.show(sProcessingProperty + oError);
			};
		},

		clearSignature: function (sVbeln) {
			var data = {
				Vbeln: sVbeln
			};
			this._callFunctionImport("/ClearSignature", data, null, "isBusySaving");
		},

		bindVbelnTo: function (oModel, sVbeln, target) {
			// the binding should be done after insuring that the metadata is loaded successfully
			var oView = target.getView();
			target.sVbeln = sVbeln;

			oModel.metadataLoaded().then(function () {

				var sPath = "/" + target.getModel().createKey("Events", {
					VBELN: sVbeln
				});
				oView.bindElement({
					path: sPath,
					events: {
						dataRequested: function () {
							oView.setBusy(true);
						},
						dataReceived: function () {
							oView.setBusy(false);
						}
					}
				});

				var oData = oModel.getData(sPath);
				//if there is no data the model has to request new data
				if (!oData) {
					oView.setBusyIndicatorDelay(0);
					oView.getElementBinding().attachEventOnce("dataReceived", function () {
						// reset to default
						oView.setBusyIndicatorDelay(null);
						// this._checkIfProductAvailable(sPath);
					});
				}
			});
		}

	});
});