sap.ui.define([
	"./BaseController",
	"../model/Signature",
	"../model/formatter",
	"../util/controls",
	"sap/ui/core/Fragment",
	"sap/ui/model/Filter",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function (
	BaseController,
	Signature,
	formatter,
	controls,
	Fragment,
	Filter,
	MessageToast,
	MessageBox) {
	"use strict";

	// shortcut for sap.ui.core.MessageType
	//	var MessageType = sap.ui.core.MessageType;

	return BaseController.extend("Signature.controller.Sign", {

		exit: function () {
			this._oHelper.destroy();
		},

		onInit: function () {

			this._confirmEscapeDialog = null;
			this._wizard = this.byId("signWizard");
			this._oNavContainer = this.byId("wizardNavContainer");

			this.initMessageManager(this);

			var oComponent = this.getOwnerComponent();
			this._router = oComponent.getRouter();
			this._router.getRoute("sign").attachPatternMatched(this._routePatternMatched, this);

			this._oResourceBundle = this.getResourceBundle(); // inherit von BaseController
			this._oHelper = new Signature(oComponent);

			this.initDraftModel();

			this._oReleaser = {
				step: this.byId("signReleaserStep"),
				pad: this.byId("signature-pad"), // Lager
				field: this.byId("sName"),
				button: this.byId("btnClear")
			};
			this._oReleaserSign = Object.assign({
				property: "/SignatureIssuer"
			}, this._oReleaser);
			this._oReleaserName = Object.assign({
				property: "/Issuer"
			}, this._oReleaser);

			this._oReceiver = {
				step: this.byId("signReceiverStep"),
				pad: this.byId("signature-pad2"), // Empfänger
				field: this.byId("sRecvName"),
				button: this.byId("btnClear2")
			};
			this._oReceiverSign = Object.assign({
				property: "/SignatureReceiver"
			}, this._oReceiver);
			this._oReceiverName = Object.assign({
				property: "/Receiver"
			}, this._oReceiver);
		},

		_routePatternMatched: function (oEvent) {

			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);

			this._oMessageManager.removeAllMessages(); // reset potential server-side messages

			this._validateWizardStep("contentStep");

			this.byId("signScenario").setSelectedKey("normal"); // Set default scenario
		},

		_validateWizardStep: function (sStepName) {
			var oStep = this.byId(sStepName);
			if (oStep && this._wizard) {
				this._wizard.setCurrentStep(oStep);
				oStep.setValidated(true);
			};
		},

		onReviewCompleted: function () {
			// Check if scenario without signature is active (Blanko, nur Drucken und abschliessen)
			var oStep = this.byId("signScenario");

			switch (oStep.getSelectedKey()) {
			case "blanko":
				MessageToast.show(this._oResourceBundle.getText("blank.output"));

				this._wizard.goToStep(this.byId("signReceiverStep"));
				this.getRouter().navTo("blanko", {
					id: this.sVbeln
				});
				break;
			default:
				break;
			};
		},

		_validateSign: function (oSource) {
			var oInput = oSource.field; // First check Input field	
			var sPath = "draft>"; // oInput.getBindingContext().getPath() + "/";
			var sTarget = sPath + oInput.getBindingPath("value");

			this.removeMessageFromTarget(sTarget);

			var oState = formatter.validateInput(oInput.getValue());
			if (oState.valid) {
				if (oSource.pad.isEmpty()) { // Then check SignPad
					oState = {
						valid: false,
						errorId: "missing.signature",
						state: "Warning"
					};
				} else {
					oState.state = "None";
				};
			};
			if (!oState.valid) {
				var sMessage = this._oResourceBundle.getText(oState.errorId);
				oInput.setValueStateText(sMessage);
				// Messages.popoverMessage(sMessage,
				// 	oInput.getLabels()[0].getText(),
				// 	MessageType.Error,
				// 	sTarget, this);
			};

			oInput.setValueState(oState.state);
			oSource.step.setValidated(oState.valid);
		},

		onClearButton: function (oEvent) {
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oReleaser.button:
				oSource = this._oReleaserSign;
				break;
			case this._oReceiver.button:
				oSource = this._oReceiverSign;
				break;
			default:
				return;
			};

			oSource.pad.clear();

			this._validateSign(oSource);
			this._wizard.setCurrentStep(oSource.step);
		},

		onSignChange: function (oEvent) {
			// Whenever the clear text name is changed in the input field, update the draft model and validate
			// onSignChange is the change event defined in the XML view.
			var oSource; // undefined

			switch (oEvent.getSource()) {
			case this._oReleaser.field:
				oSource = this._oReleaserName;
				break;
			case this._oReceiver.field:
				oSource = this._oReceiverName;
				break;
			case this._oReleaser.pad:
				oSource = this._oReleaserSign;
				break;
			case this._oReceiver.pad:
				oSource = this._oReceiverSign;
				break;
			default:
				return;
			};

			this._validateSign(oSource);
		},

		onSignerNameValueHelp: function (oEvent) {
			var sInputValue = oEvent.getSource().getValue();

			// create value help dialog
			if (!this._valueHelpDialog) {
				this._valueHelpDialog = sap.ui.xmlfragment(
					"Signature.view.InputAssisted",
					this
				);
				this.getView().addDependent(this._valueHelpDialog);
			}

			// create a filter for the binding
			this._valueHelpDialog.getBinding("items").filter([new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sInputValue
			)]);

			// open value help dialog filtered by the input value
			this._valueHelpDialog.open(sInputValue);
		},

		_handleValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter(
				"Name",
				sap.ui.model.FilterOperator.Contains, sValue
			);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		_handleValueHelpClose: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("selectedItem");
			if (oSelectedItem) {
				this._oReleaser.field.setValue(oSelectedItem.getTitle()); // also sets JSON draft model property "/Issuer" (TwoWay binding)
				this._validateSign(this._oReleaserName);
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		_readDraftModel: function (oControl) {
			var oModel = oControl.getModel("draft"); // Vbeln, Issuer, Receiver, SignatureIssuer, SignatureReceiver
			// maintain signatures in the draft model now
			oModel.setProperty("/SignatureIssuer", oControl._oReleaser.pad.export()); // Signatur Lager
			oModel.setProperty("/SignatureReceiver", oControl._oReceiver.pad.export()); // Signatur Abholer

			return oModel.getProperty("/"); // read JSON Model
		},

		onWizardCompleted: function () {

			var fnSaveError = function (oDetails) {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);
				//	Messages.popoverHelpMessage(this.sVbeln, oDetails, this);

				this._oBusyDialog.close();

				this.getRouter().navTo("error", {
					id: this.sVbeln
				});
			};

			var fnAfterSave = function () {
				// this._oApplicationProperties.setProperty("/isBusySaving", false);

				// Messages.popoverTechnicalMessage(this.sVbeln,
				// 	this._oResourceBundle.getText("step.save"),
				// 	this._oResourceBundle.getText("pdf.Created"),
				// 	MessageType.Success,
				// 	null, this);

				this._oBusyDialog.close();

				this.getRouter().navTo("complete", {
					id: this.sVbeln
				});
			};

			// save draft to oData model
			var oSignData = this._readDraftModel(this);

			if (this._oBusyDialog) {
				this._oBusyDialog.open();
				this._oHelper.saveSignature(fnAfterSave.bind(this), fnSaveError.bind(this), oSignData);
			} else {
				Fragment.load({
					name: "Signature.view.BusyDialog",
					controller: this
				}).then(function (oFragment) {
					this._oBusyDialog = oFragment;
					controls.attachControlToView(this.getView(), this._oBusyDialog);

					this._oBusyDialog.open();
					this._oHelper.saveSignature(fnAfterSave.bind(this), fnSaveError.bind(this), oSignData);
				}.bind(this));
			};

		},

		onBusyDialogClosed: function (oEvent) {
			if (oEvent.getParameter("cancelPressed")) {
				MessageToast.show(this._oResourceBundle.getText("save.cancelled"));
			};
		},

		/**
		 * Always navigates back to home
		 * @override
		 */
		onBack: function () {
			this.getRouter().navTo("home");
		},

		_draftExists: function (oControl) {
			var oModel = oControl.getModel("draft"); // Vbeln, Issuer, Receiver, SignatureIssuer, SignatureReceiver
			var oData = oModel.getProperty("/"); // read JSON Model, SignatureIssuer, SignatureReceiver not maintained

			return ((typeof oData.Issuer !== "undefined" && oData.Issuer !== "") ||
				(typeof oData.Receiver !== "undefined" && oData.Receiver !== "") ||
				!oControl._oReleaser.pad.isEmpty() ||
				!oControl._oReceiver.pad.isEmpty());
		},

		confirmBack: function () {
			if (this._draftExists(this)) {
				var oActionHome = this.getResourceBundle().getText("homeButtonText");

				MessageBox.confirm(this.getResourceBundle().getText("confirm.Content"), {
					title: this.getResourceBundle().getText("confirm.Title"),
					actions: [oActionHome, MessageBox.Action.CANCEL],
					emphasizedAction: MessageBox.Action.CANCEL,
					onClose: function (sAction) {
						if (sAction === oActionHome) {
							this.onBack();
						}
					}.bind(this)
				});
			} else {
				this.onBack();
			}
		}

	});
});