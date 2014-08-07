/*!
 * jQuery Chatbox Plugin v0.2.0-alpha
 * https://github.com/haozki/Chatbox
 *
 * Copyright 2013 Haozki
 * Released under the MIT license
 */

(function($, window, undefined){
    var Chatbox = function (options){
        this.init(options);
    };

    Chatbox.prototype = {
        constructor: Chatbox,

        // 初始化一个实例
        init: function (options){
            var self = this;    // 缓存当前实例的this指针
            var opts = this.opts = setOption(options);
            var boxFrame = '\
                <div class="chatbox" id="'+opts.boxId+'">\n\
                    <div class="chatbox-header">\n\
                        <div class="chatbox-title">'+opts.title+'</div>\n\
                        <div class="chatbox-options">\n\
                            <a class="minimize" href="#">-</a>\n\
                            <a class="close" href="#">X</a>\n\
                        </div>\n\
                        <br clear="all">\n\
                    </div>\n\
                    <div class="chatbox-body">\n\
                        <div class="chatbox-content"></div>\n\
                        <div class="chatbox-input">\n\
                            <textarea class="chatbox-textarea"></textarea>\n\
                        </div>\n\
                    </div>\n\
                </div>\n';
            $('.chatbox-container').append(boxFrame);

            // 将插入页面的DOM对象由jQuery封装并保存在当前实例的属性中
            var $elem = this.$elem = $('#'+opts.boxId);

            // 窗口焦点动作处理
            /** Note: 整个窗体Div并不支持focus事件,借由click事件来触发子元素.chatbox-textarea的focus事件也就相当于触发了窗体本身的focus事件 */
            $elem.on('click',function(){
                $elem.addClass('chatbox-selected');
                $elem.find('.chatbox-textarea').focus();
            });
            $elem.find('.chatbox-textarea').on('focusout',function(){
                $elem.removeClass('chatbox-selected');
            });

            // 窗口最小化处理动作
            $elem.find('.minimize').on('click',function(event){
                // 阻止浏览器默认按键事件
                event.preventDefault();

                $elem.find('.chatbox-body').slideToggle();

                // 阻止浏览器默认按键事件（对于IE等）
                return false;
            });
            $elem.find('.chatbox-title').on('click',function(){
                $elem.find('.chatbox-body').slideToggle(500);
            });

            // 窗口关闭处理动作
            $elem.find('.close').on('click',function(event){
                // 阻止浏览器默认按键事件
                event.preventDefault();

                self.destroy();

                // 阻止浏览器默认按键事件（对于IE等）
                return false;
            });

            // 输入区域焦点处理动作
            $elem.find('.chatbox-textarea').on('blur',function(){
                $(this).removeClass('chatbox-textarea-selected');
            }).on('focus',function(){
                $(this).addClass('chatbox-textarea-selected');
            });

            // 消息发送处理动作
            $elem.find('.chatbox-textarea').on('keydown',function(event){
                if(event.keyCode == 13){
                    // 阻止浏览器默认按键事件
                    event.preventDefault();

                    self.message($(this).val(),'to');

                    // 阻止浏览器默认按键事件（对于IE等）
                    return false;
                }
            });

            // 在页面中显示当前DOM元素
            $elem.slideDown(500);

            // 将对象实例附加到DOM对象中
            $elem.data('chatbox',this);

            /** 触发回调函数 **/
            setCallback.call(this,'onChatboxCreate');

            /** 输出调试 **/
            debug('Chatbox create','[',this,$elem,']');
        },
        // API方法：弹出聊天窗
        show: function(){
            this.$elem.find('.chatbox-body').slideDown(500);
        },
        // API方法：隐藏聊天窗
        hide: function(){
            this.$elem.find('.chatbox-body').slideUp(500);
        },
        // API方法：启用聊天窗
        enable: function(){
            this.opts.enabled = true;
            this.$elem.find('.chatbox-textarea').prop('disabled',false);

            /** 触发回调函数 **/
            setCallback.call(this,'onChatboxEnable');

            /** 输出调试 **/
            debug('Chatbox enabled','[',this,this.$elem,']');
        },
        // API方法：禁用聊天窗
        disable: function(){
            this.opts.enabled = false;
            this.$elem.find('.chatbox-textarea').prop('disabled',true);

            /** 触发回调函数 **/
            setCallback.call(this,'onChatboxDisable');

            /** 输出调试 **/
            debug('Chatbox disabled','[',this,this.$elem,']');
        },
        // API方法：设置消息发送
        messageTo: function(msg){
            if (msg == ''){
                this.message('Can not send empty message','system');
            }else{
                msg = msg.replace(/^\s+|\s+$/g,""); // 去除首尾空字符
                msg = msg.replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;");    // 去除HTML特殊标记
                var msgItem = '\
                    <div class="chatbox-message">\n\
                        <span class="message-by">'+globalOptions.user+'</span>\n\
                        <span class="message-content">'+msg+'</span>\n\
                    </div>\n';
                this.$elem.find('.chatbox-content').append(msgItem);
                this.$elem.find('.chatbox-content').scrollTop(this.$elem.find('.chatbox-content').get(0).scrollHeight);
                this.$elem.find('.chatbox-textarea').val('').focus();

                /** 触发回调函数 **/
                setCallback.call(this,'onMessageSend',msg);

                /** 输出调试 **/
                debug('Message send',this.opts.id,':',msg);
            }
        },
        // API方法：设置消息接收内容(包括系统消息)
        message: function(msg,type){
            var self = this;
            switch (type){
                case 'to':
                    this.messageTo(msg);
                    break;
                case 'from':
                    var msgItem = '\
                        <div class="chatbox-message">\n\
                            <span class="message-from">'+this.opts.user+'</span>\n\
                            <span class="message-content">'+msg+'</span>\n\
                        </div>\n';
                    this.$elem.find('.chatbox-content').append(msgItem);
                    this.$elem.find('.chatbox-content').scrollTop(this.$elem.find('.chatbox-content').get(0).scrollHeight);
                    this.blink();
                    this.animate();

                    /** 触发回调函数 **/
                    setCallback.call(this,'onMessageReceive',msg);

                    /** 输出调试 **/
                    debug('Message receive',this.opts.id,':',msg);
                    break;
                case 'system':
                    var msgItem = '\
                        <div class="chatbox-message">\n\
                            <span class="chatbox-info">'+msg+'</span>\n\
                        </div>\n';
                    this.$elem.find('.chatbox-content').append(msgItem);
                    this.$elem.find('.chatbox-content').scrollTop(this.$elem.find('.chatbox-content').get(0).scrollHeight);
                    this.blink();
                    this.animate();

                    /** 触发回调函数 **/
                    setCallback.call(this,'onMessageSystem',msg);

                    /** 输出调试 **/
                    debug('System message',this.opts.id,':',msg);
                    break;
            }
        },
        // API方法：高亮标题栏闪烁提示
        blink: function(){
            var self = this;
            var blinkTimes = 0;
            do{
                setTimeout(function(){
                    self.$elem.find('.chatbox-header').toggleClass('chatbox-blink');
                },300*blinkTimes);
                blinkTimes++;
                if (blinkTimes == 6){
                    blinkTimes = 0;
                    break;
                }
            }while(blinkTimes != 0);
        },
        // API方法：消息提醒动画
        animate: function(){
            var self = this;
            this.$elem
                .addClass('animated '+globalOptions.animate)
                .one('webkitAnimationEnd mozAnimationEnd oAnimationEnd animationEnd',function(){
                    $(this).removeClass('animated '+globalOptions.animate);
                });

            // 当浏览器不支持以上事件时,由程序控制动画停止
            setTimeout(function(){
                self.$elem.removeClass('animated '+globalOptions.animate);
            },800);

            return this;
        },
        // API方法：销毁聊天窗实例
        destroy: function(){
            var self = this;
            // 从页面淡出该DOM元素并从页面移除
            this.$elem.fadeOut(500,function(){
                $(this).remove();
                // 销毁对象实例
                boxInstance[self.opts.id] = null;
                delete boxInstance[self.opts.id];

                /** 触发回调函数 **/
                setCallback.call(self,'onChatboxDestroy');

                /** 输出调试 **/
                debug('Chatbox close','[',self,self.$elem,']');

                // 重新布局
                layout();
            });
        }
    };

    // 聊天窗实例对象集合
    var boxInstance = {};

    // 聊天窗口布局
    function layout(){
        var align = 0;
        $.each(boxInstance, function(i){
            var ibox = $("#chatbox_"+i);
            var offset = align * (ibox.width()+5) + 20;

            /** 输出调试 **/
            debug('Chatbox realignment',ibox,' offset:',offset);
            ibox.css('right', offset+'px');
            align++;
        });
    }
    
    // 处理选项默认值
    function setOption(options){
        options.boxId = globalOptions.idPrefix + options.id;    // 设定聊天窗Div的id值
        options.enabled = true;
        if (options.title == null) {
            options.title = 'Chat with '+options.user;
        }
        return options;
    }
        
    // 设置回调响应（执行优先级：全局回调函数 > 实例回调函数）
    function setCallback(callback){
        if (typeof this.opts[callback] === 'function'){
            // 触发实例回调函数
            this.opts[callback].apply(this, Array.prototype.slice.call(arguments, 1));

            /** 输出调试 **/
            debug(callback,this.opts[callback]);
        }else if (typeof globalOptions[callback] === 'function'){
            // 触发全局回调函数
            globalOptions[callback].apply(this, Array.prototype.slice.call(arguments, 1));

            /** 输出调试 **/
            debug(callback,globalOptions[callback]);
        }else{
            /** 输出调试 **/
            debug(callback,'No callback function set');
            return false;
        }
    }

    // 调试函数
    function debug(){
        if (globalOptions.debug == true){
            var logger = window.console['debug'];
            if (typeof logger === 'function'){
                logger.apply(window.console, arguments);
            }
        }
    }

    // 定义全局选项
    var globalOptions = {};

    // 全局选项默认值
    var globalOptionsDefault = {
        id:null,
        user:null,
        debug:false,
        idPrefix:'chatbox_',
        animate:'bounce'

        /* 针对全局的回调函数
        onChatboxCreate     // 创建聊天窗时触发
        onChatboxEnable     // 聊天窗被启用时触发
        onChatboxDisable    // 聊天窗被禁用时触发
        onMessageSend       // 发送消息时触发
        onMessageEmpty      // 发送消息为空时触发
        onMessageReceive    // 收到消息时触发
        onChatboxDestroy    // 销毁聊天窗时触发
        */
    }

    $.chatbox = function(opts){
        if (!$('.chatbox-container').length){
            $('body').append('<div class="chatbox-container"></div>');
        }
        // 当且仅当参数是对象，并且聊天窗实例id不存在时创建新的实例
        if (typeof opts === 'object' && !boxInstance[opts.id]){
            // 覆盖全局选项默认值
            globalOptions = $.extend({}, globalOptionsDefault, $.chatbox.globalOptions || {});

            // 实例选项默认值
            var defaults = {
                id:null,
                user:null,
                title:null

                /* 针对具体实例的回调函数
                onChatboxCreate     // 创建聊天窗时触发
                onChatboxEnable     // 聊天窗被启用时触发
                onChatboxDisable    // 聊天窗被禁用时触发
                onMessageSend       // 发送消息时触发
                onMessageEmpty      // 发送消息为空时触发
                onMessageReceive    // 收到消息时触发
                onChatboxDestroy    // 销毁聊天窗时触发
                */
            };

            // 以用户的自定义选项覆盖实例默认选项
            var options = $.extend(defaults, opts || {});

            // 创建实例
            boxInstance[options.id] = new Chatbox(options);

            /** 输出调试 **/
            debug('Chatbox instance collections',boxInstance);
            layout();
        }
        // 当参数是实例id时返回该实例的引用
        else if(typeof opts === 'number' || typeof opts === 'string'){
            if (boxInstance[opts] != undefined){
                return boxInstance[opts];
            }else{
                /** 输出调试 **/
                debug('Error','Chatbox not exist')
            }
        }else{
            return false;
        }
    };

    // 全局API方法：返回当前所有聊天窗实例的队列
    $.chatbox.getQueue = function(){
        return boxInstance;
    }

    // 全局选项自定义值（默认对外暴露默认值）
    $.chatbox.globalOptions = globalOptionsDefault;

})(jQuery, window);