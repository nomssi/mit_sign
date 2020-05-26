sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/Core",
	"sap/ui/core/UIComponent",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/m/MessagePopover",
	"sap/m/MessageItem",
	"../util/messages"
], function (Controller, Core, UIComponent, JSONModel, History, MessagePopover, MessageItem, Messages) {
	"use strict";

	return Controller.extend("Signature.controller.BaseController", {

		initMessageManager: function (that) {
			that._oView = that.getView();
			that._oLink = Messages.createDefaultLink();

			// create a message manager and register the message model
			that._oMessageManager = Core.getMessageManager();
			that._oMessageManager.registerObject(that._oView, true);
			that._oProcessor = that._oMessageManager.getMessageModel();
			that._oView.setModel(that._oProcessor, "message");
		},

		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		initDraftModel: function () {
			//  Model for Draft handling
			var oData = {
				Receiver: {
					Name: "",
					Url: ""
				},
				Releaser: {
					Name: "",
					Url: ""
				},
				Vbeln: ""
			};
			var oDraftModel = new JSONModel(oData); // binding is 2 ways
			this.setModel(oDraftModel, "draft");
		},

		setDraftProperty: function (sProperty, vValue) {
			this.getModel("draft").setProperty(sProperty, vValue);
		},

		bindVbelnTo: function (oModel, sVbeln, target) {
			// the binding should be done after insuring that the metadata is loaded successfully
			var oView = target.getView();
			target.sVbeln = sVbeln;

			this.initDraftModel();
			this.setDraftProperty("/Vbeln", sVbeln);

			oModel.metadataLoaded().then(function () {

				var sObjectPath = "/" + target.getModel().createKey("Events", {
					VBELN: sVbeln
				});
				oView.bindElement({
					path: sObjectPath,
					events: {
						dataRequested: function () {
							oView.setBusy(true);
						},
						dataReceived: function () {
							oView.setBusy(false);
						}
					}
				});

				var oData = oModel.getData(sObjectPath);
				// if there is no data the model has to request new data
				if (!oData) {
					oView.setBusyIndicatorDelay(0);
					oView.getElementBinding().attachEventOnce("dataReceived", function () {
						oView.setBusyIndicatorDelay(null); // reset to default
					});
				}
			});
		},

		removeMessageFromTarget: function (sTarget) {
			// clear potential server-side messages to allow saving the item again
			this._oMessageManager.getMessageModel().getData().forEach(function (oMessage) {
				if (oMessage.target === sTarget) {
					this._oMessageManager.removeMessages(oMessage);
				}
			}.bind(this));
		},

		/**
		 * Only validation on client side, does not involve a back-end server.
		 * @param {sap.ui.base.Event} oEvent Press event of the button to display the MessagePopover
		 * From: openui5/src/sap.m/test/sap/m/demokit/cart/webapp/
		 */
		handleMessagePopoverPress: function (oEvent) {
			if (!this._oMessagePopover) {
				this._createMessagePopover();
			};
			// this._oMessagePopover.openBy(oEvent.getSource());
			this._oMessagePopover.toggle(oEvent.getSource());
		},

		_createMessagePopover: function () {
			/**
			 * Gather information that will be visible on the MessagePopover
			 */
			this._oMessagePopover = new MessagePopover(this.createId("errorMessagePopover"), {
				items: {
					path: "message>/",
					template: new MessageItem({
						type: "{message>type}",
						title: "{message>message}",
						active: "{message>active}",
						subtitle: "{message>additionalText}",
						groupName: "{message>message}",
						activeTitle: "{message>activeTitle}",
						description: "{message>description}"
					})
				},
				groupItems: true,
				afterClose: function () {
					if (this._oMessagePopover) {
						this._oMessagePopover.destroy();
					}
				}
			});
			this._addDependent(this._oMessagePopover);

			this._oMessagePopover.getBinding("items").attachChange(function (oEvent) {
				this._oMessagePopover.navigateBack();
			}.bind(this));
		},

		// To be able to stub the addDependent function in unit test, we added it in a separate function
		_addDependent: function (oMessagePopover) {
			this.getView().addDependent(oMessagePopover);
		},

		/**
		 * Navigates back in browser history or to the home screen
		 */
		onBack: function () {
			var sPreviousHash = History.getInstance().getPreviousHash();
			if (typeof sPreviousHash === "undefined") {
				this.getRouter().navTo("home");
			} else {
				window.history.go(-1);
			}
		},

		/**
		 * Always navigates back to home
		 * @override
		 */
		onHome: function () {
			this.getRouter().navTo("home");
		}
	});
});