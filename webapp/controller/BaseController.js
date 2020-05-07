sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast",
	"sap/ui/core/UIComponent",
	"sap/ui/core/routing/History",
	"../util/messages"
], function(Controller, MessageToast, UIComponent, History, Messages) {
	"use strict";

	return Controller.extend("Signature.controller.BaseController", {
		
		initMessageManager: function(oView, that) {
			that._oLink = Messages.createDefaultLink();
			that._oView = oView;

			// create a message manager and register the message model
			that._oMessageManager = sap.ui.getCore().getMessageManager();
			that._oMessageManager.registerObject(oView, true);
			that._oProcessor = that._oMessageManager.getMessageModel();	
			oView.setModel(that._oProcessor, "message");
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

		/**
		 * React to FlexibleColumnLayout resize events
		 * Hides navigation buttons and switches the layout as needed
		 * @param {sap.ui.base.Event} oEvent the change event
		 */
		onStateChange: function (oEvent) {
			var sLayout = oEvent.getParameter("layout"),
				iColumns = oEvent.getParameter("maxColumnsCount");

			if (iColumns === 1) {
				this.getModel("appView").setProperty("/smallScreenMode", true);
			} else {
				this.getModel("appView").setProperty("/smallScreenMode", false);
				// swich back to two column mode when device orientation is changed
				if (sLayout === "OneColumn") {
					this._setLayout("Two");
				}
			}
		},

		/**
		 * Sets the flexible column layout to one, two, or three columns for the different scenarios across the app
		 * @param {string} sColumns the target amount of columns
		 * @private
		 */
		_setLayout: function (sColumns) {
			if (sColumns) {
				this.getModel("appView").setProperty("/layout", sColumns + "Column" + (sColumns === "One" ? "" : "sMidExpanded"));
			}
		},

		/**
		 * Apparently, the middle page stays hidden on phone devices when it is navigated to a second time
		 * @private
		 */
		_unhideMiddlePage: function () {
			// TODO: bug in sap.f router, open ticket and remove this method afterwards
			setTimeout(function () {
				this.getOwnerComponent().getRootControl().byId("layout").getCurrentMidColumnPage().removeStyleClass("sapMNavItemHidden");
			}.bind(this), 0);
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
		},
		
		/**
		 * Navigates back in browser history or to the home screen
		 */
		onBack: function () {
			this._unhideMiddlePage();
			var oHistory = History.getInstance();
			var oPrevHash = oHistory.getPreviousHash();
			if (typeof oPrevHash === "undefined") {
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