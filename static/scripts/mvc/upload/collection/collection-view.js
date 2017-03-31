define(["utils/utils","mvc/upload/upload-model","mvc/upload/collection/collection-row","mvc/upload/upload-ftp","mvc/ui/ui-popover","mvc/ui/ui-select","mvc/ui/ui-misc","mvc/collection/list-collection-creator","utils/uploadbox"],function(a,b,c,d,e,f,g){return Backbone.View.extend({upload_size:0,collection:new b.Collection,counter:{announce:0,success:0,error:0,running:0,reset:function(){this.announce=this.success=this.error=this.running=0}},initialize:function(a){var b=this;this.app=a,this.options=a.options,this.list_extensions=a.list_extensions,this.list_genomes=a.list_genomes,this.ui_button=a.ui_button,this.ftp_upload_site=a.currentFtp(),this.setElement(this._template()),this.btnLocal=new g.Button({id:"btn-local",title:"Choose local files",onclick:function(){b.uploadbox.select()},icon:"fa fa-laptop"}),this.btnFtp=new g.Button({id:"btn-ftp",title:"Choose FTP files",onclick:function(){b._eventFtp()},icon:"fa fa-folder-open-o"}),this.btnCreate=new g.Button({id:"btn-new",title:"Paste/Fetch data",onclick:function(){b._eventCreate()},icon:"fa fa-edit"}),this.btnStart=new g.Button({id:"btn-start",title:"Start",onclick:function(){b._eventStart()}}),this.btnBuild=new g.Button({id:"btn-build",title:"Build",onclick:function(){b._eventBuild()}}),this.btnStop=new g.Button({id:"btn-stop",title:"Pause",onclick:function(){b._eventStop()}}),this.btnReset=new g.Button({id:"btn-reset",title:"Reset",onclick:function(){b._eventReset()}}),this.btnClose=new g.Button({id:"btn-close",title:"Close",onclick:function(){b.app.modal.hide()}}),_.each([this.btnLocal,this.btnFtp,this.btnCreate,this.btnStop,this.btnReset,this.btnStart,this.btnBuild,this.btnClose],function(a){b.$(".upload-buttons").prepend(a.$el)}),this.uploadbox=this.$(".upload-box").uploadbox({url:this.app.options.nginx_upload_path,announce:function(a,c){b._eventAnnounce(a,c)},initialize:function(a){return b.app.toData([b.collection.get(a)],b.history_id)},progress:function(a,c){b._eventProgress(a,c)},success:function(a,c){b._eventSuccess(a,c)},error:function(a,c){b._eventError(a,c)},complete:function(){b._eventComplete()},ondragover:function(){b.$(".upload-box").addClass("highlight")},ondragleave:function(){b.$(".upload-box").removeClass("highlight")}}),console.log(this.list_extensions),this.ftp=new e.View({title:"FTP files",container:this.btnFtp.$el}),this.select_extension=new f.View({css:"upload-footer-selection-compressed",container:this.$(".upload-footer-extension"),data:_.filter(this.list_extensions,function(a){return!a.composite_files}),value:this.options.default_extension,onchange:function(a){b.updateExtension(a)}}),this.collectionType="list",this.select_collection=new f.View({css:"upload-footer-selection-compressed",container:this.$(".upload-footer-collection-type"),data:[{id:"list",text:"List"},{id:"paired",text:"Paired"},{id:"list:paired",text:"List of Pairs"}],value:"list",onchange:function(a){b.updateCollectionType(a)}}),this.$(".upload-footer-extension-info").on("click",function(a){b.showExtensionInfo({$el:$(a.target),title:b.select_extension.text(),extension:b.select_extension.value(),placement:"top"})}).on("mousedown",function(a){a.preventDefault()}),this.select_genome=new f.View({css:"upload-footer-selection",container:this.$(".upload-footer-genome"),data:this.list_genomes,value:this.options.default_genome,onchange:function(a){b.updateGenome(a)}}),this.collection.on("remove",function(a){b._eventRemove(a)}),this._updateScreen()},_eventAnnounce:function(a,d){this.counter.announce++;var e=new b.Model({id:a,file_name:d.name,file_size:d.size,file_mode:d.mode||"local",file_path:d.path,file_data:d,extension:this.select_extension.value(),genome:this.select_genome.value()});this.collection.add(e);var f=new c(this,{model:e});this.$(".upload-table > tbody:first").append(f.$el),this._updateScreen(),f.render()},_eventProgress:function(a,b){var c=this.collection.get(a);c.set("percentage",b),this.ui_button.model.set("percentage",this._uploadPercentage(b,c.get("file_size")))},_eventSuccess:function(a,b){var c=b.outputs[0].hid;console.log(b.outputs[0]);var d=this.collection.get(a);d.set({percentage:100,status:"success",hid:c}),this.ui_button.model.set("percentage",this._uploadPercentage(100,d.get("file_size"))),this.upload_completed+=100*d.get("file_size"),this.counter.announce--,this.counter.success++,this._updateScreen(),Galaxy.currHistoryPanel.refreshContents()},_eventError:function(a,b){var c=this.collection.get(a);c.set({percentage:100,status:"error",info:b}),this.ui_button.model.set({percentage:this._uploadPercentage(100,c.get("file_size")),status:"danger"}),this.upload_completed+=100*c.get("file_size"),this.counter.announce--,this.counter.error++,this._updateScreen()},_eventComplete:function(){this.collection.each(function(a){"queued"==a.get("status")&&a.set("status","init")}),this.counter.running=0,this._updateScreen()},_eventBuild:function(){var a=this.collection.map(function(a){return Galaxy.currHistoryPanel.collection.getByHid(a.get("hid"))}),b=new Galaxy.currHistoryPanel.collection.constructor(a);b.historyId=Galaxy.currHistoryPanel.collection.historyId,Galaxy.currHistoryPanel.buildCollection(this.collectionType,b,!0),this.counter.running=0,this._updateScreen(),this._eventReset(),this.app.modal.hide()},_eventRemove:function(a){var b=a.get("status");"success"==b?this.counter.success--:"error"==b?this.counter.error--:this.counter.announce--,this.uploadbox.remove(a.id),this._updateScreen()},showExtensionInfo:function(a){var b=this,c=a.$el,d=a.extension,f=a.title,g=_.findWhere(b.list_extensions,{id:d});this.extension_popup&&this.extension_popup.remove(),this.extension_popup=new e.View({placement:a.placement||"bottom",container:c}),this.extension_popup.title(f),this.extension_popup.empty(),this.extension_popup.append(this._templateDescription(g)),this.extension_popup.show()},_eventFtp:function(){if(this.ftp.visible)this.ftp.hide();else{this.ftp.empty();var a=this;this.ftp.append(new d({collection:this.collection,ftp_upload_site:this.ftp_upload_site,onadd:function(b){a.uploadbox.add([{mode:"ftp",name:b.path,size:b.size,path:b.path}])},onremove:function(b){a.collection.remove(b)}}).$el),this.ftp.show()}},_eventCreate:function(){this.uploadbox.add([{name:"New File",size:0,mode:"new"}])},_eventStart:function(){if(!(0==this.counter.announce||this.counter.running>0)){var a=this;this.upload_size=0,this.upload_completed=0,this.collection.each(function(b){"init"==b.get("status")&&(b.set("status","queued"),a.upload_size+=b.get("file_size"))}),this.ui_button.model.set({percentage:0,status:"success"}),this.counter.running=this.counter.announce,this.history_id=this.app.currentHistory(),this.uploadbox.start(),this._updateScreen()}},_eventStop:function(){this.counter.running>0&&(this.ui_button.model.set("status","info"),$(".upload-top-info").html("Queue will pause after completing the current file..."),this.uploadbox.stop())},_eventReset:function(){0==this.counter.running&&(this.collection.reset(),this.counter.reset(),this.uploadbox.reset(),this.select_extension.value(this.options.default_extension),this.select_genome.value(this.options.default_genome),this.ui_button.model.set("percentage",0),this._updateScreen())},updateExtension:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("extension")!=c.options.default_extension&&b||d.set("extension",a)})},updateCollectionType:function(a){this.collectionType=a},updateGenome:function(a,b){var c=this;this.collection.each(function(d){"init"!=d.get("status")||d.get("genome")!=c.options.default_genome&&b||d.set("genome",a)})},_updateScreen:function(){var a="";a=0==this.counter.announce?this.uploadbox.compatible()?"&nbsp;":"Browser does not support Drag & Drop. Try Firefox 4+, Chrome 7+, IE 10+, Opera 12+ or Safari 6+.":0==this.counter.running?"You added "+this.counter.announce+" file(s) to the queue. Add more files or click 'Start' to proceed.":"Please wait..."+this.counter.announce+" out of "+this.counter.running+" remaining.",this.$(".upload-top-info").html(a);var b=0==this.counter.running&&this.counter.announce+this.counter.success+this.counter.error>0,c=0==this.counter.running&&this.counter.announce>0,d=0==this.counter.running&&0==this.counter.announce&&this.counter.success>0&&0==this.counter.error,e=0==this.counter.running,f=this.counter.announce+this.counter.success+this.counter.error>0;this.btnReset[b?"enable":"disable"](),this.btnStart[c?"enable":"disable"](),this.btnStart.$el[c?"addClass":"removeClass"]("btn-primary"),this.btnBuild[d?"enable":"disable"](),this.btnBuild.$el[d?"addClass":"removeClass"]("btn-primary"),this.btnStop[this.counter.running>0?"enable":"disable"](),this.btnLocal[e?"enable":"disable"](),this.btnFtp[e?"enable":"disable"](),this.btnCreate[e?"enable":"disable"](),this.btnFtp.$el[this.ftp_upload_site?"show":"hide"](),this.$(".upload-table")[f?"show":"hide"](),this.$(".upload-helper")[f?"hide":"show"]()},_uploadPercentage:function(a,b){return(this.upload_completed+a*b)/this.upload_size},_templateDescription:function(a){if(a.description){var b=a.description;return a.description_url&&(b+='&nbsp;(<a href="'+a.description_url+'" target="_blank">read more</a>)'),b}return"There is no description available for this file extension."},_template:function(){return'<div class="upload-view-default"><div class="upload-top"><h6 class="upload-top-info"/></div><div class="upload-box"><div class="upload-helper"><i class="fa fa-files-o"/>Drop files here</div><table class="upload-table ui-table-striped" style="display: none;"><thead><tr><th>Name</th><th>Size</th><th>Status</th><th/></tr></thead><tbody/></table></div><div class="upload-footer"><span class="upload-footer-title-compressed">Collection Type:</span><span class="upload-footer-collection-type"/><span class="upload-footer-title-compressed">File Type:</span><span class="upload-footer-extension"/><span class="upload-footer-extension-info upload-icon-button fa fa-search"/> <span class="upload-footer-title-compressed">Genome (set all):</span><span class="upload-footer-genome"/></div><div class="upload-buttons"/></div>'}})});
//# sourceMappingURL=../../../../maps/mvc/upload/collection/collection-view.js.map