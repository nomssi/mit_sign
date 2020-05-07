sap.ui.define([
	"sap/ui/core/message/Message",
	"sap/ui/core/library",
	"./BaseController"
], function (Message, coreLibrary, BaseController) {
	"use strict";

	// shortcut for sap.ui.core.MessageType
	var MessageType = coreLibrary.MessageType;
		
	return BaseController.extend("Signature.controller.Error", {

		onInit: function () {
			this.getRouter().getRoute("error").attachPatternMatched(this._routePatternMatched, this);

			this._oView = this.getView();
			this.initMessageManager(this._oView.byId("signError"), this);
			
			this._addMockMessages();
		},

		_routePatternMatched: function (oEvent) {
			var sVbeln = oEvent.getParameter("arguments").id;
			this.bindVbelnTo(this.getModel(), sVbeln, this);
		},
			
		_addMockMessages: function () {
				if (this._oMessageManager && !this._oMessageManager.getMessageModel().oData.length) {
					var that = this;
					this._oMessageManager.addMessages(
						[
							new Message({
								message: "Error message",
								type: 	MessageType.Error,
								additionalText: "Example of additionalText",
								description: "Example of description",
								target: "message",
								processor: that._oView.getModel()
							}),
							new Message({
								message: "Information message",
								type: MessageType.Information,
								additionalText: "Example of additionalText",
								description: "Example of description",
								target: "message",
								processor: that._oView.getModel()
							}),
							new Message({
								message: "Success message",
								type: MessageType.Success,
								additionalText: "Example of additionalText",
								description: "Example of description",
								target: "message",
								processor: that._oView.getModel()
							}),
							new Message({
								message: "Warning message",
								type: MessageType.Warning,
								additionalText: "Example of additionalText",
								description: "Example of description",
								target: "message",
								processor: that._oView.getModel()
							})
						]
					);
				}
			}
	});
});