// Helper class for centrally handling oData CRUD and function import services. The interface provides the business
// meanings for the application and can be reused in different places where the UI-specific actions after the call
// could still be different and will be handled in the corresponding controller of the view.
// Every (main) view of this app has an instance of this class as an attribute so that it can forward all explicit
// backend calls to it.
// Note that this class forwards all delete operations to helper class nw.epm.refapps.products.manage.model.RemoveService,
// which is instantiated on demand.
sap.ui.define([
	"sap/ui/base/Object",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast"
], function(Object, JSONModel, MessageToast) {
	"use strict";

	return Object.extend("mit_sign.model.Signature", {
		constructor: function(oComponent, oMainView) {
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oODataModel = oComponent.getModel();
			//this._oApplicationProperties = oComponent.getModel("appProperties");
			//this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");
			this._oMainView = oMainView;
			this._oWhenNoDraft = new Promise(function(fnResolve) {
				fnResolve(); // Since we are currently not in the process of deleting a draft, the Promise is resolved immediately
			});
			//this._fnSetBackBusyDraftState = this._oApplicationProperties.setProperty.bind(this._oApplicationProperties, "/isBusyCreatingDraft",false);

			
		},
		getPathForSignature: function(sVbeln) {
			return this._oODataModel.createKey("/Event", {
				VBELN: sVbeln
			});
		},
		// This method checks whether the user currently possesses a draft.
		// fnHandleDraftId is called when this information has been retrieved.
		// When a draft was found the id of the draft and the whole draft object are
		// transferred as parameters to fnHandleDraft. Otherwise fnHandleDraft is called
		// with faulty parameters.
		readSignature: function(sVbeln, fnHandleDraft, fnError) {
			var fnSuccess = function(oResponseContent) {
				if(oResponseContent.results === 0){
					this._createSignature(sVbeln,fnHandleDraft);
				}else{
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
		readEvent: function(sVbeln, fnHandleDraft, fnError) {
			var fnSuccess = function(oResponseContent) {
				if(oResponseContent.results === 0){
					MessageToast.show("nix gefunden");
				}else{
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
		createSignature: function(sVbeln,fnDraftCreated) {
			//this._oApplicationProperties.setProperty("/isBusyCreatingDraft", true);
			//prüfen, ob es bereits einen Entwurf gibt
			this.readSignature(sVbeln,fnDraftCreated,this._createDraft);
		},
		
		_createSignature : function(sVbeln,fnDraftCreated) {
			// At least one attribute must be filled in the object passed to the create call (requirement of the oData
			// service)
			var oNew = {
				Vbeln: sVbeln
			};
			this._oODataModel.create("/Signatures", oNew, {
				success: fnDraftCreated,
				error: this._getErrorForProcessing("isBusyCreatingDraft")
			});
		},
		
		// Saves ProductDraft each time a user edits a field
		saveSignature: function(sVbeln,fnAfterSaved) {
			this._submitChanges(null, null);
			
			var data = {
					Vbeln: sVbeln
				};
			this._callFunctionImport("/SaveSignature", data, fnAfterSaved, "isBusySaving");
		},
		
		updateSignature: function(fnAfterSaved) {
			this._submitChanges(null, null);
		},
		
		_submitChanges: function(fnSaveFailed, fnAfterSaved) {
			if (this._bIsChanging) {
				return;
			}
			if (this._oODataModel.hasPendingChanges()) {
				this._sMessage = null;
				var fnSuccess = function(oResponseData) {
					this._bIsChanging = false;
					//if(oResponseData.__batchResponses){
						if (!this._oODataModel.hasPendingChanges() || !this._sMessage) {
							var i;
							for (i = 0; i < oResponseData.__batchResponses.length && !this._sMessage; i++) {
								var oEntry = oResponseData.__batchResponses[i];
								if (oEntry.response) {
									this._sMessage = messages.extractErrorMessageFromDetails(oEntry.response.body);
								}
							}
						}
					//}
					if (this._sMessage) {
						fnAfterSaved(this._sMessage);
					} else {
						this._submitChanges(fnSaveFailed, fnAfterSaved);
					}
				}.bind(this);
				this._bIsChanging = true;
				var oParameters = {
					success: fnSuccess,
					error: fnSaveFailed,
					batchGroupId: "editsignature"
				};
				this._oODataModel.submitChanges(oParameters);
			}/* else if (this.oDraftToActivate) {
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
		
		// Saves Draft each time a user edits a field
		/*deleteDraft: function(fnAfter){
			var _fnAfter = function(){
				
				this.createDraft(null);
				this._oODataModel.read("/Drafts", {
					success: null,
					error: null
				});
				fnAfter();
			}.bind(this);
			this._callFunctionImport("/DraftDelete", {}, _fnAfter, "");
		},*/
		
		_callFunctionImport: function(sFunctionName, oURLParameters, fnAfterFunctionExecuted, sProcessingProperty) {
			this._oODataModel.callFunction(sFunctionName, {
				method: "POST",
				urlParameters: oURLParameters,
				success: fnAfterFunctionExecuted,
				error: this._getErrorForProcessing(sProcessingProperty)
			});
		},
		_getErrorForProcessing: function(sProcessingProperty) {
			return function(oError) {
				//this._oApplicationProperties.setProperty("/" + sProcessingProperty, false);
				MessageToast.show(oError);
			};
		},
		
		clearSignature: function(sVbeln){
			var data = {
				Vbeln: sVbeln
			};
			this._callFunctionImport("/ClearSignature", data, null, "isBusySaving");
		}
	});
});