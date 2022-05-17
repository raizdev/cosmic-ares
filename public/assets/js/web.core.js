var Web;

function htmlDecode(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

function WebInterface() {
    /*
     * Main elements
     * */
    this.web_document = null;

    /*
     * Managers
     * */
    this.pages_manager = null;
    this.ajax_manager = null;
    this.notifications_manager = null;
    this.hotel_manager = null;
    this.customforms_manager = null;

    /*
     * Main initiation
     * */
    this.init = function () {
        // Assign main elements
        this.web_document = $("body");

        // Initialize managers
        this.hotel_manager = new WebHotelManagerInterface();
        this.hotel_manager.init();
        this.pages_manager = new WebPagesManagerInterface();
        this.ajax_manager = new WebAjaxManagerInterface();
        this.pages_manager.init();
        this.dialog_manager = new WebDialogManagerInterface();
        this.notifications_manager = new WebNotificationsManagerInterface();

        // Handlers
        this.forms_handler();
        this.links_handler();

        // Responsive
        this.init_responsive();
    };

    /*
     * Forms
     * */
    this.forms_handler = function () {
        var self = this;
        this.web_document.on("submit", "form:not(.default-prevent)", function (event) {
            event.preventDefault();

            if ($(this).attr("method") !== "get")
                self.ajax_manager.post('/' + $(this).attr("action"), new FormData(this), null, $(this));
            else {
                var href = $(this).attr("action").replace(Site.url + "/", "").replace(Site.url, "");
                self.pages_manager.load(href + "?" + $(this).serialize());
            }
        });
    };

    /*
     * Links
     * */
    this.links_handler = function () {
        var self = this;
        this.web_document.on("click", "a", function (event) {
            if ($(this).attr("href") === "#" || $(this).hasClass("disabled"))
                event.preventDefault();

        }).on("mouseover", "a:not([target])", function () {
            if ($(this).attr("href"))
                if (!$(this).attr("href") && !$(this).attr("href").match(/^#/))
                    $(this).attr("target", "_blank");

        }).on("click", "a:not([target])", function (event) {
            event.preventDefault();
            if ($(this).attr("href") !== "#" && $(this).attr("href") !== "javascript:;" && $(this).attr("href") !== "javascript:void(0)" && $(this).attr("href") !== undefined) {
                var href = $(this).attr("href");
                if (!href)
                    href = "home";
                if (href.match(/^\#([A-z0-9-_]+)$/i))
                    window.location.hash = href;
                else if (window.location.pathname + window.location.search !== "/" + href || window.location.hash)
                    self.pages_manager.load(href);
            }

        }).on("click", ".login-dialog-button", function () {
            $.magnificPopup.open({
                items: {
                    type: "inline",
                    src: "#login-dialog"
                },
                callbacks: {
                    open: function () {
                        $(".rounded-input").unbind().keypress(function (e) {
                            if (e.which == 13) {
                                $.magnificPopup.close();
                                $("#login-request").unbind().click();
                            }
                        });
                    }
                },
                mainClass: "my-mfp-zoom-in"
            });
        }).on("click", "#login-request", function (event) {
            event.preventDefault();

            var verification_data = {
                username: $(".login-form [name=username]").val(),
                password: $(".login-form [name=password]").val(),
                csrftoken: $(".login-form [name=csrftoken]").val(),
                remember_me: $(".login-form [name=remember_me]").is(':checked')
            };

            $.magnificPopup.close();

            Web.ajax_manager.post("/auth/login/request", verification_data, function (result) {

                if (result.status == "pincode_required") {
                    setTimeout(function () {
                        Web.dialog_manager.create("confirm", Locale.web_fill_pincode, Locale.web_twostep, null, "pincode", function (result) {
                            verification_data.pincode = result.toString();
                            Web.ajax_manager.post("/auth/login/request", verification_data);

                            $.magnificPopup.close();
                        });
                    }, 500);
                }
            });
        }).on("click", ".about-dialog-button", function () {
            $.magnificPopup.open({
                items: {
                    type: "inline",
                    src: "#about-dialog"
                },
                removalDelay: 300,
                mainClass: "my-mfp-zoom-in"
            });
        }).on("click", "[data-close-popup = 'true']", function () {
            $.magnificPopup.close();

        }).on("click", ".fa-flag", function () {
            if (User.is_logged) {
                var action = $(this).attr("data-report");

                $.magnificPopup.open({
                    items: {
                        type: "inline",
                        src: "#report-item"
                    },
                    removalDelay: 300,
                    mainClass: "my-mfp-zoom-in"
                });

                $("#reportForm").attr('action', 'ajax/report/' + action);
                $('#reportItemid').val($(this).attr("data-id"));
            } else {
                Web.notifications_manager.create("error", Locale.web_login, Locale.web_loggedout);
            }
        }).on("click", ".fa-times-circle", function () {
            if (User.is_logged) {
                var id = $(this).attr("data-id");
                self.ajax_manager.post("/ajax/report/photo", {
                    itemId: id
                }, function (result) {
                    if (result.status == "success") {
                        $(".photos[data-id=" + id + "]").empty();
                        $.magnificPopup.close();
                    }
                });
            }
        });
    };

    /*
     * Responsive
     * */
    this.init_responsive = function () {
        var self = this;

        // Menu
        this.web_document.find(".navigation-container").after('<nav class="mobile-navigation-container"><ul class="navigation-menu"></ul></nav>');

        this.web_document.find(".navigation-container .navigation-menu .navigation-item:not(.main-link-item):not(.navigation-right-side-item)").each(function () {
            var mobile_item = $(this).clone().appendTo(".mobile-navigation-container .navigation-menu");
            mobile_item.removeClass("selected").removeAttr("data-category");
            if (mobile_item.hasClass("has-items"))
                mobile_item.children("a").attr("href", "#");
        });

        $('<li class="navigation-item mobile-menu cant-select">Menu</li>').prependTo(".navigation-container .navigation-menu").click(function () {
            self.web_document.find(".mobile-navigation-container").finish().slideToggle();
            self.web_document.find(".mobile-navigation-container .navigation-item.has-items .navigation-submenu").finish().slideUp();
        });

        this.web_document.find(".mobile-navigation-container .navigation-item.has-items>a").click(function () {
            self.web_document.find(".mobile-navigation-container .navigation-item.has-items").not($(this).parent()).find(".navigation-submenu").finish().slideUp();
            $(this).parent().find(".navigation-submenu").finish().slideToggle();
        });

        this.web_document.find(".mobile-navigation-container a").click(function () {
            if ($(this).attr("href") !== "#") {
                self.web_document.find(".mobile-navigation-container .navigation-item.has-items .navigation-submenu").finish().slideUp();
                self.web_document.find(".mobile-navigation-container").finish().slideUp();
            }
        });
    };
}

$(function () {
    Web = new WebInterface();
    Web.init();
});

function WebPagesManagerInterface() {
    this.current_page_url = null;
    this.current_page_interface = null;
    this.last_page_url = "/";
    this.page_container = null;

    /*
     * Manager initialization
     * */
    this.init = function () {
        var self = this;

        this.page_container = $(".content-container");

        this.current_page_url = window.location.pathname.substr(1) + window.location.search;
        this.current_page_interface = new WebPageInterface(this, this.page_container.attr("data-page"));
        this.current_page_interface.assign_interface();

        if (this.current_page_url === "") {
            this.current_page_url = "/";
        }

        if (this.current_page_url.match(/^hotel/)) {
            Web.hotel_manager.open_hotel(this.current_page_url);
        }

        History.Adapter.bind(window, "statechange", function () {
            var state = History.getState();
            var url = state.url.replace(document.location.origin, "").substring(1);

            if (self.current_page_url !== url) {
                if (url === "/") {
                    self.load("home", null, false, null, false);
                } else {
                    self.load("/" + url, null, false, null, false);
                }
            }
            self.current_page_url = url;
        });
    };

    /*
     * History push
     * */
    this.push = function (url, title, history_replace) {
        url = url.replace(/^\/|\/$/g, "");
        this.current_page_url = url;

        if (this.current_page_url.indexOf('profile') > -1) {
        } else {
             $(".content-container").removeAttr('style')
        }

        if (!history_replace) {
            History.pushState(null, title ? title : Config.data.hotel_name, "/" + url);
        } else {
            History.replaceState(null, title ? title : Config.data.hotel_name, "/" + url);
        }
    };

    /*
     * Load page
     * */
    this.load = function (url, data, scroll, callback, history_push, history_replace) {

        if (scroll === undefined) {
            scroll = true
        }

        if (history_push === undefined) {
            history_push = true
        }

        if (history_replace === undefined) {
            history_replace = false
        }

        var self = this;
        var body = $("body");

        if (url === "")
            url = "/";

        if (url.charAt(0) !== "/") {
            url = "/" + url;
        }

        if (!url.match(/^\/hotel/)) {
            PageLoading.show();
            $.ajax({
                type: "get",
                url: url,
                dataType: null,
                error: function (request, status, error) {
                    PageLoading.hide();
                    Web.notifications_manager.create(request.statusText, request.responseJSON.errors[0].message, request.responseJSON.status);
                }
            }).done(function (result) {
                PageLoading.hide();

                var decode = htmlDecode(result);
                var result = JSON.parse(decode)[0];

                // Change full page
                if (result.location) {
                    window.location = result.location;
                    return null;
                }

                if(result.errors) {
                    var errorTitle = result.errors[0].field;
                    var errorMessage = result.errors[0].message;

                    Web.notifications_manager.create('error', errorMessage, errorTitle, (Number.isInteger(result.timer) ? result.timer : undefined), (result.link ? result.link : null));
                }

                // Create dialog
                if (result.dialog) {
                    Web.dialog_manager.create("default", result.dialog, result.page, null, null);
                    return;
                }


                // Change page
                else if (result.loadpage)
                    self.load(result.loadpage);

                // Replace page
                else if (result.replacepage)
                    self.load(result.replacepage, null, true, null, true, true);

                // Build new page
                else {

                    self.current_page_interface = new WebPageInterface(self, result.page, scroll, result.data);
                    self.current_page_interface.build();

                    if (typeof callback === "function")
                        callback(result);
                }

                // Hide hotel
                if (body.hasClass("hotel-visible"))
                    body.removeClass("hotel-visible");

                // Push history & change document title
                if (window.location.pathname + window.location.search === "/" + url)
                    return;

                var pageTitle = result.page + ' - ' + Config.data.hotel_name;
                document.title = capitalizeFirstLetter(pageTitle);
                self.push(url, capitalizeFirstLetter(pageTitle), false);
            });
        } else {
            Web.hotel_manager.open_hotel(url.replace("hotel?", "").replace("hotel", ""));
            self.push(url, "Hotel - " + Config.data.hotel_name, false);
        }
    };
}

function WebPageInterface(manager, type, scroll, page_data) {
    if (scroll === undefined) {
        scroll = true;
    }

    /*
     * Page configuration
     * */
    this.manager = manager;
    this.type = type;
    this.scroll = scroll;
    this.page_data = page_data;
    this.page_interface = null;

    /*
     * Build page
     * */
    this.build = function () {
        if (this.page_data === null)
            return;

        var self = this;
        // Assign page

        self.manager.page_container.attr("data-page", this.type).html(this.page_data);

        // Update navigation
        var navigation_container = $(".navigation-container");

        // Set category
        var category = this.type.substr(0, this.type.lastIndexOf("_"));
        if (isEmpty(category))
            category = this.type;

        navigation_container.find(".navigation-item.selected:not([data-category='" + category + "'])").removeClass("selected");
        navigation_container.find(".navigation-item[data-category='" + category + "']").addClass("selected");

        // Custom page interface
        this.assign_interface();
    };

    /*
     * Custom interface
     * */
    this.assign_interface = function () {
        if (this.type === "home")
            this.page_interface = new WebPageHomeInterface(this);
        else if (this.type === "registration")
            this.page_interface = new WebPageRegistrationInterface(this);
        else if (this.type === "article")
            this.page_interface = new WebPageArticleInterface(this);
        else if (this.type === "shop")
            this.page_interface = new WebPageShopInterface(this);
        else if (this.type === "shop_offers")
            this.page_interface = new WebPageShopOffersInterface(this);
        else if (this.type === "help_requests")
            this.page_interface = new WebPageHelpRequestsInterface(this);
        else if (this.type === "help_new")
            this.page_interface = new WebPageHelpRequestsInterface(this);
        else if (this.type === "profile")
            this.page_interface = new WebPageProfileInterface(this);
        else if (this.type === "community_photos")
            this.page_interface = new WebPageCommunityPhotosInterface(this);
        else if (this.type === "community_value")
            this.page_interface = new WebPageCommunityValueInterface(this);
        else if (this.type === "jobs")
            this.page_interface = new WebPageJobsInterface(this);
        else if (this.type === "settings_preferences")
            this.page_interface = new WebPageSettingsInterface(this);
        else if (this.type === "settings_namechange")
            this.page_interface = new WebPageSettingsNamechangeInterface(this);
        else if (this.type === "settings_verification")
            this.page_interface = new WebPageSettingsVerificationInterface(this);
        else if (this.type === "password_claim")
            this.page_interface = new WebPagePasswordClaimInterface(this);
        else if (this.type === "forum")
            this.page_interface = new WebPageForumInterface(this);
        else if (this.type === "shop_history")
            this.page_interface = new WebPageBadgeInterface(this);


        if (this.page_interface !== null)
            this.page_interface.init();
    };

    /*
     * Get page container
     * */
    this.get_page_container = function () {
        return this.manager.page_container;
    };

    /*
     * Events
     * */
    this.update = function () {};
}

function WebAjaxManagerInterface() {

    this.get = function (url, callback) {
        PageLoading.show();

        // Requests
        $.ajax({
            type: "get",
            url: url,
            dataType: "json",
            processData: false,
            contentType: false,
            error: function (request, status, error) {
                PageLoading.hide();
                Web.notifications_manager.create("error", error, request.responseText);
            }
        }).done(function (result) {
            PageLoading.hide();

            if (typeof callback === "function")
                callback(result);
        });
    }

    /*
     * Post method
     * */
    this.post = function (url, data, callback, form) {
        // Prepare data
        if (!(data instanceof FormData)) {
            if (!(data instanceof Object))
                return;

            var data_source = data;
            data = new FormData();
            for (var key in data_source) {
                if (!data_source.hasOwnProperty(key))
                    continue;

                data.append(key, data_source[key]);
            }
        }

        // Check form name
        if (form !== undefined) {
            if (form.attr("action") === "login")
                data.append("return_url", window.location.href);
        }

        PageLoading.show();

        if (url.charAt(0) === "/") {
            url = url.slice(1);
        }

        // Requests
        $.ajax({
            type: "post",
            url: url,
            data: data,
            dataType: "json",
            processData: false,
            contentType: false
        }).done(function (result) {
            PageLoading.hide();

            // Change page
            if (result.data && result.data.pagetime)
                setTimeout(function () {
                    window.location = result.data.pagetime
                }, 2500);


            // Change page
            if (result.data && result.data.loadpage)
                Web.pages_manager.load(result.data.loadpage);

            // Replace page
            if (result.data && result.data.replacepage)
                Web.pages_manager.load(result.data.replacepage, null, true, null, true, true);

            // Check if is form
            if (form !== undefined) {
                if (!result.captcha_error)
                    form.find(".registration-recaptcha").removeClass("registration-recaptcha").removeAttr("data-sitekey").removeAttr("data-callback");
            }

            if(result.errors) {
                var errorTitle = result.errors[0].field;
                var errorMessage = result.errors[0].message;

                Web.notifications_manager.create('error', errorMessage, errorTitle, (Number.isInteger(result.timer) ? result.timer : undefined), (result.link ? result.link : null));
            }

            // Create notification
            if (result.data && !isEmpty(result.data.status) && !isEmpty(result.data.message)) {
                Web.notifications_manager.create(result.data.status,  result.data.message, result.data.title, (Number.isInteger(result.timer) ? result.timer : undefined), (result.data.link ? result.data.link : null));
            }

            // Callback if exists
            if (typeof callback === "function")
                callback(result);
        }).fail(function (xhr, error) {
            Web.notifications_manager.create(error, JSON.parse(xhr.responseText).errors[0].message, error);
            PageLoading.hide();
        });
    };
}

function WebNotificationsManagerInterface() {
    this.titles_configutation = {
        success: 'success',
        error: 'error',
        info: 'info'
    };
    this.notifications = {};

    this.create = function (type, message, title, timer, link) {
        var notification_id = (new Date().getTime() + Math.floor((Math.random() * 10000) + 1)).toString(16);

        if (timer === undefined)
            timer = 5;

        this.notifications[notification_id] = new WebNotificationInterface(this, notification_id, type, message, title, timer, link);
        this.notifications[notification_id].init();
    };

    this.destroy = function (id) {
        if (!this.notifications.hasOwnProperty(id))
            return null;

        this.notifications[id].notification.remove();
        delete this.notifications[id];
    };
}

function WebNotificationInterface(manager, id, type, message, title, timer, link) {
    this.manager = manager;
    this.id = id;
    this.type = type;
    this.message = message;
    this.title = title;
    this.timer = timer;
    this.link = link;
    this.notification = null;
    this.timeout = null;


    this.init = function () {
        var self = this

        const notyf = new Notyf({
            position: {
                x: 'right',
                y: 'top',
            },
            types: [
                {
                    duration: 2000,
                    dismissible: true
                }
            ]
        });

        notyf.open({
            type: (this.manager.titles_configutation[this.type] == "error" ? "error" : "success"),
            message: (this.title) ? this.title + ': ' + this.message : this.message
        });
    };
}

function WebDialogManagerInterface() {
    this.buttons = null;
    this.input = null;
    this.type = null;
    this.title = null;
    this.content = null;
    this.callback = null;

    this.create = function (type, content, title, buttons, input, callback) {
        // Reset default
        this.buttons = {
            cancel: Locale.web_dialog_cancel,
            confirm: Locale.web_dialog_validate
        };
        this.type = null;
        this.title = null;
        this.content = null;
        this.input = null;
        this.callback = null;

        // Assign new values
        this.type = type;
        this.title = title === undefined ? Locale.web_dialog_confirm : title;
        this.content = content;
        this.callback = callback;
        this.input = input;

        if (buttons !== undefined)
            this.assign_buttons(buttons);

        this.build();
    };

    this.build = function () {

        var self = this;

        var template = [
            '<div class="' + this.type + '-popup dialog-popup zoom-anim-dialog">\n' +
            '    <h3>' + this.title + '</h3>\n' +
            '    ' + this.content + '\n' +
            '    <div class="input-container"></div>' +
            '    <div class="buttons-container"></div>' +
            '</div>'
        ].join("");

        var dialog = $(template);

        dialog.find(".buttons-container").append('<button class="rounded-button ' + (this.type === "confirm" ? 'red' : 'lightblue') + ' cancel">' + this.buttons.cancel + '</button>');

        if (this.input !== null) {
            dialog.find(".input-container").append('<br /><input type="text" class="' + this.input + ' rounded-input purple-active dialog-input">');
        }

        if (this.type === "confirm")
            dialog.find(".buttons-container").append('<button class="rounded-button red plain confirm">' + this.buttons.confirm + '</button>');

        $.magnificPopup.open({
            modal: this.type === "confirm",
            items: {
                src: dialog,
                type: "inline"
            },
            callbacks: {
                open: function () {
                    var content = $(this.content);

                    content.unbind().on("click", ".confirm", function () {

                        var result = $('.dialog-input').map(function () {
                            return $(this).val();
                        }).toArray();

                        $.magnificPopup.close();
                        $(document).off("keydown", keydownHandler);

                        if (typeof self.callback === "function")
                            self.callback(result)

                    }).on("click", ".cancel", function () {
                        $.magnificPopup.close();
                        $(document).off("keydown", keydownHandler);

                    });

                    var keydownHandler = function (event) {
                        if (event.keyCode === 13) {
                            content.find(".confirm").click();
                            return false;
                        } else if (event.keyCode === 27) {
                            content.find(".cancel").click();
                            return false;
                        }
                    };

                    $(document).on("keydown", keydownHandler);
                }
            }
        });
    };

    this.assign_buttons = function (buttons) {
        for (var name in buttons) {
            if (buttons.hasOwnProperty(name))
                this.buttons[name] = buttons[name];
        }
    };

}