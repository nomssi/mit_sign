sap.ui.define([
	"./BaseController",
	"../model/formatter",
	"sap/ui/Device",
	"../model/Signature"
], function (
	BaseController,
	formatter,
	Device,
	Signature) {
	"use strict";

	return BaseController.extend("mit_sign.controller.Sign", {
		formatter : formatter,

		onInit: function () {

			this._oView = this.getView();
			//this._initViewPropertiesModel();
			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);
			this._router.getRoute("signcompleted").attachMatched(this._routePatternMatched, this);

			/*this._oApplicationProperties = oComponent.getModel("appProperties");
			this._oApplicationController = this._oApplicationProperties.getProperty("/applicationController");*/
			this._oResourceBundle = oComponent.getModel("i18n").getResourceBundle();
			this._oHelper = new Signature(this.getOwnerComponent(), this.getView());			
			/*this._sValidPath = sap.ui.require.toUrl("sap/m/sample/PDFViewerEmbedded") + "/sample.pdf";
			this._sInvalidPath = sap.ui.require.toUrl("sap/m/sample/PDFViewerEmbedded") + "/sample_nonexisting.pdf";
			this._oModel = new JSONModel({
				Source: this._sValidPath,
				Title: "My Custom Title",
				Height: "600px"
			});
			this.getView().setModel("PDF",this._oModel);*/
			
			/*this._router.getTarget("product").attachDisplay(function (oEvent) {
				this.fnUpdateProduct(oEvent.getParameter("data").productId);// update the binding based on products cart selection
			}, this);*/
			//Binding f�r die Signatur erstellen, am besten die Kopfdaten der Lieferung mit den zwei Feldern f�r die Signatur verkn�pfen
			//so kann die Signatur als base64 an SAP gesendet werden und im n�chsten schritt angezeigr werden
		},

		_routePatternMatched: function(oEvent) {
				
			var sVbeln = oEvent.getParameter("arguments").id,
				oView = this.getView(),
				oModel = oView.getModel();

			this.sVbeln = sVbeln;
			
			//ToDo in oHelper auslagern
			
			var oModel = this.getModel();

		
			// the binding should be done after insuring that the metadata is loaded successfully
			oModel.metadataLoaded().then(function () {
				
				var sPath = "/" + this.getModel().createKey("Events", {
						VBELN: sVbeln
					});
				oView.bindElement({
					path : sPath,
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
					oView.getElementBinding().attachEventOnce("dataReceived", function() {
						// reset to default
						oView.setBusyIndicatorDelay(null);
						//this._checkIfProductAvailable(sPath);
					}.bind(this));
				}
				
				
				
			}.bind(this));
			
			
		},

		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
		},
		
		onClearButton: function(){
			
			this._oHelper.clearSignature(this.sVbeln);
			//this.byId("signature-pad").clear();
			//this.byId("sName").setValue("");
			
		},
		
		onSaveButton: function(){
			var oHelper = this._oHelper;

			/*var fnSave = function(oBlob){
				console.log(oBlob);
		    	var r = new Response(oBlob);
		    	console.log(r.text());&nbsp;
		    	var u = URL.createObjectURL(oBlob);
		    	console.log(u);
		    	
		    	var fnSubmitDraftSuccess = function(sMessage) {
					if (sMessage && oControl) {
						oControl.setValueState("Error");
						oControl.setValueStateText(sMessage);
					}
				};
				var data = {
						
				}
				oHelper.saveSignature(fnSubmitDraftSuccess);
		    	
			}.bind(this);
			
			var oCtrl = this.byId("signature-pad");
			oCtrl.getSignature(fnSave);*/

			var fnAfterSave = function(oData){
				if(oData.PDFUrl!=""){
					var step = this.byId("signStep");
					step.setValidated(true);
					
				}
			}.bind(this);
			this._oHelper.saveSignature(this.sVbeln, fnAfterSave);
		},
		
		onCompleteSigning: function(){
			
			return false;
		},
		onInputChange: function(oEvent) {
			// Whenever the value of an input field is changed, the system must
			// update the product draft. For most of the fields, no specific
			// processing is required on the update of the product draft. onInputChange is the
			// change event defined in the XML view for such fields.
			var oField = oEvent.getSource();
			jQuery.sap.log.Level.TRACE(oField);
			
			// Workaround to ensure that both the supplier Id and Name are updated in the model before the
			// draft is updated, otherwise only the Supplier Name is saved to the draft and Supplier Id is lost
			setTimeout(function() {
				this._fieldChange(oField);
			}.bind(this), 0);
		},
		
		_fieldChange: function(oControl) {
			// Handler for a changed field that needs to be written to the draft.  This allows
			// specific processing for the "Change" event on the input fields, such as for numbers
			// to set empty to "0".
			//this._setDirty();
			// Removes previous error state
			//oControl.setValueState(ValueState.None);
			// Callback function in the event that saving draft is unsuccessful
			var fnSubmitDraftSuccess = function(sMessage) {
				if (sMessage && oControl) {
					oControl.setValueState("Error");
					oControl.setValueStateText(sMessage);
				}
			};
			this._oHelper.updateSignature(fnSubmitDraftSuccess);
		}
	});
});
