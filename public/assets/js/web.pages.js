function WebHotelManagerInterface() {
    this.hotel_container = null;
    this.current_page_url = null;
    /*
     * Manager initialization
     * */
    this.init = function() {
        this.current_page_url = window.location.pathname.substr(1) + window.location.search;
        this.hotel_container = $("#hotel-container");

        this.hotel_container.find(".client-buttons .client-close").click(this.close_hotel);
        this.hotel_container.find(".client-buttons .client-fullscreen").click(this.toggle_fullscreen.bind(this));
        this.hotel_container.find(".client-buttons .client-count").click(this.update_online);
    };

    this.update_online = function () {
        Web.ajax_manager.get("/user/online", function (result) {
            $("body").find(".client-buttons .client-count #count").text(result.data);
        });
    };

    /*
     * Hotel toggle
     * */
    this.close_hotel = function() {
        Web.pages_manager.load(Web.pages_manager.last_page_url, null, true, null, true);
    };

    this.open_hotel = function(arguments) {
        var actions = {};
        var container = this.hotel_container;

        if (arguments !== undefined) {
            parse_str(arguments, actions);
        }
      
        var argument = arguments;
        var body = $("body");

        this.current_page_url = argument;
        this.hotel_url = argument;


        if (!body.hasClass("hotel-visible")) {
            if (container.find(".client-frame").length === 0) {

                let argumentAction = '';
                if (argument !== "") {
                    let argumentAction = argument.replace("hotel?room=", "&room=");
                }

                Web.ajax_manager.get("/auth/ticket", function (result) {

                    container.prepend('<iframe class="client-frame nitro" src="' + Config.data.nitro_url + '/?sso=' + result.data.ticket + argumentAction + '"></iframe>');

                    let frame = document.getElementById('nitro');

                    window.FlashExternalInterface = {};
                    window.FlashExternalInterface.disconnect = () => {
                        Web.notifications_manager.create("error", "Client disconnected!");
                        Web.pages_manager.load('/home');
                    };

                    if (frame && frame.contentWindow) {
                        window.addEventListener("message", ev => {
                            if (!frame || ev.source !== frame.contentWindow) return;
                            const legacyInterface = "Nitro_LegacyExternalInterface";
                            if (typeof ev.data !== "string") return;
                            if (ev.data.startsWith(legacyInterface)) {
                                const {
                                    method,
                                    params
                                } = JSON.parse(
                                    ev.data.substr(legacyInterface.length)
                                );
                                if (!("FlashExternalInterface" in window)) return;
                                const fn = window.FlashExternalInterface[method];
                                if (!fn) return;
                                fn(...params);
                                return;
                            }
                        });
                    }
                });
            }
            body.addClass("hotel-visible");
        }
    };


    /*
     * Fullscreen toggle
     * */
    this.toggle_fullscreen = function() {
        if ((document.fullScreenElement && document.fullScreenElement) || (!document.mozFullScreen && !document.webkitIsFullScreen)) {
            if (document.documentElement.requestFullScreen) {
                document.documentElement.requestFullScreen();
            } else if (document.documentElement.mozRequestFullScreen) {
                document.documentElement.mozRequestFullScreen();
            } else if (document.documentElement.webkitRequestFullScreen) {
                document.documentElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }

            this.hotel_container.find(".client-buttons .client-fullscreen .client-fullscreen-icon").addClass("hidden");
            this.hotel_container.find(".client-buttons .client-fullscreen .client-fullscreen-icon-back").removeClass("hidden");
        } else {
            if (document.cancelFullScreen) {
                document.cancelFullScreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }

            this.hotel_container.find(".client-buttons .client-fullscreen .client-fullscreen-icon").removeClass("hidden");
            this.hotel_container.find(".client-buttons .client-fullscreen .client-fullscreen-icon-back").addClass("hidden");
        }
    };
}

function WebPageArticleInterface(main_page) {
    this.main_page = main_page;

    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

    };
}

function WebPageSettingsNamechangeInterface(main_page) {
    this.main_page = main_page;
    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

        page_container.find("#username").keyup(function() {

            var namechange = page_container.find("#username");
            var csrftoken = page_container.find("#csrftoken");
            var button = page_container.find("#changeButton");

            var givenString = namechange.val();
            var csrftokenString = csrftoken.val();
           
            if (givenString.length > 0) {
                Web.ajax_manager.post("/settings/namechange/availability", {
                    username: givenString
                }, function(result) {
                    if (givenString !== User.username) {
                        if (result.status !== "unavailable") {
                            button.removeAttr('disabled', 'disabled').html(Locale.web_page_settings_namechange_request);
                        } else {
                            button.attr('disabled', 'disabled').html(Locale.web_page_settings_namechange_not_available);
                        }
                    } else {
                        button.attr('disabled', 'disabled').html(Locale.web_page_settings_namechange_not_available);
                    }
                });
            } else {
                button.attr('disabled', 'disabled').html(Locale.web_page_settings_namechange_choose_name);
            }
        });

    };

}

function WebPageSettingsInterface(main_page) {
    this.main_page = main_page;
    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

        // Checkbox change event
        page_container.find(".settings").change(function() {
            var post = $(this).attr("data-id");
            var type = this.checked;
            var csrftoken = $("[name=csrftoken]").val();

            var array = ["hide_inroom", "hide_staff", "hide_online", "hide_last_online", "hide_home"]

            if (jQuery.inArray(post, array) !== -1) {
                type = type ? false : true;
            }
            var dataString = {
                post: post,
                type: type,
                csrftoken: csrftoken
            };

            self.send_data(dataString);
        });

    };

    /*
     * Custom functions
     * */
    this.send_data = function(data) {
        Web.ajax_manager.post("/settings/preferences/validate", data);
    };

}

function WebPageSettingsVerificationInterface(main_page) {
    this.main_page = main_page;

    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

        // Init type select
        page_container.find(".type-select").selectric({
            theme: "web",
            onChange: function(event) {
                self.switch_type(event.value);
            }
        });

        // Init questions selects
        page_container.find(".questions-select").selectric({
            theme: "web"
        });

        // Checkbox change event
        page_container.find("#enable-verification-target").change(function() {
            self.switch_enable($(this).is(":checked"));
        });

        // Submit form
        page_container.find("form").submit(function(event) {
            event.preventDefault();

            var current_verification_type_enabled = page_container.find("#verification_enabled").val();
            var verification_enabled = page_container.find("input[name = 'enable_verification']").is(":checked");
            var csrftoken = $("[name=csrftoken]").val();
            var verification_data = {
                enabled: false,
                type: null,
                data: null,
                current_password: page_container.find("input[name = 'current_password']").val(),
                csrftoken: csrftoken
            };

            if (isEmpty(verification_data.current_password)) {
                Web.notifications_manager.create("error", Locale.web_page_settings_verification_fill_password, Locale.web_page_settings_verification_oops);
                return;
            }

            if (verification_enabled) {
                var verification_type = page_container.find("select[name = 'twosteps_login_type']").val();

                if (verification_type === "app") {
                    if (current_verification_type_enabled === "pincode") {
                        Web.dialog_manager.create("default", Locale.web_page_settings_verification_2fa_on, Locale.web_page_settings_verification_oops, null, null, function() {
                            app_callback();
                        });
                    } else if (isEmpty(current_verification_type_enabled))
                        app_callback();

                    function app_callback() {
                        Web.dialog_manager.create("confirm", Locale.web_page_settings_verification_2fa_secretkey, Locale.web_page_settings_verification_2fa_authcode, null, "pincode", function(result) {
                            verification_data.type = "app";
                            verification_data.data = page_container.find("#twosteps_login_data_code").val();
                            verification_data.enabled = verification_enabled;
                            verification_data.input = result.toString();

                            self.send_data(verification_data);
                        });
                    }
                } else if (verification_type === "pincode") {
                    if (current_verification_type_enabled === "app") {
                        Web.dialog_manager.create("default", Locale.web_page_settings_verification_2fa_on, Locale.web_page_settings_verification_oops, null, null, function() {
                            questions_callback();
                        });
                    } else if (current_verification_type_enabled === "pincode") {
                        Web.dialog_manager.create("default", Locale.web_page_settings_verification_pincode_on, Locale.web_page_settings_verification_oops, null, null, function() {
                            questions_callback();
                        });
                    } else
                        questions_callback();

                    function questions_callback() {
                        var twosteps_login_pincode = page_container.find("input[name = 'twosteps_login_pincode']").val();

                        verification_data.type = "pincode";
                        verification_data.data = twosteps_login_pincode;
                        verification_data.enabled = verification_enabled;

                        self.send_data(verification_data);
                    }
                } else {
                    verification_data.enabled = false;
                    self.send_data(verification_data);
                }
            } else if (current_verification_type_enabled == "app") {
                Web.dialog_manager.create("confirm", Locale.web_page_settings_verification_2fa_off, Locale.web_page_settings_verification_2fa_authcode, null, "pincode", function(result) {
                    verification_data.type = "app";
                    verification_data.enabled = false;
                    verification_data.data = page_container.find("#twosteps_login_data_code").val();
                    verification_data.input = result.toString();

                    self.send_data(verification_data);
                });
            } else if (current_verification_type_enabled == "pincode") {
                Web.dialog_manager.create("confirm", Locale.web_page_settings_verification_pincode_off, Locale.web_page_settings_verification_pincode, null, "pincode", function(result) {
                    verification_data.type = "pincode";
                    verification_data.enabled = false;
                    verification_data.input = result.toString();

                    self.send_data(verification_data);
                });
            } else {
                Web.notifications_manager.create("error", Locale.web_page_settings_verification_switch, Locale.web_page_settings_verification_oops);
            }
        });
    };

    /*
     * Custom functions
     * */
    this.send_data = function(data) {
        Web.ajax_manager.post("/settings/verification/validate", data);
    };

    this.switch_enable = function(enabled) {
        if (enabled)
            this.main_page.get_page_container().find(".verification-container").show();
        else
            this.main_page.get_page_container().find(".verification-container").hide();
    };

    this.switch_type = function(type) {
        this.main_page.get_page_container().find(".verification-selected[data-method != '" + type + "']:visible").hide();
        this.main_page.get_page_container().find(".verification-selected[data-method = '" + type + "']").show();
    };
}

function WebPageCommunityPhotosInterface(main_page) {
    var loadmore = true;

    this.main_page = main_page;
    this.photo_template = [
        '<div class="photo-container" style="display: none;">\n' +
        '    <div class="photo-content">\n' +
        '        <a href="{story}" class="photo-picture" target="_blank" style="background-image: url({story});" data-title="{photo.date.min} door {creator.username}"></a>\n' +
        '        <a href="#" class="photo-meta flex-container flex-vertical-center">\n' +
        '            <div class="photo-meta-left-side"><img src="/imaging/avatarimage?figure={creator.figure}&gesture=sml&headonly=1" alt="{creator.username}" class="pixelated"></div>\n' +
        '            <div class="photo-meta-right-side">\n' +
        '                <div class="creator-name">{creator.username}</div>\n' +
        '                <div class="published-date">{photo.date.full}</div>\n' +
        '                <span class="likes-count fc-like" data-id="{photo._id}">{photo.likes}</span> <i class="fa fa-heart" data-id="{photo._id}" style="color: #D67979;"></i>  <i class="fa fa-flag" data-id="{photo._id}" data-report="photo" style="color: #7B7777;"></i>' +
        '            </div>\n' +
        '        </a>\n' +
        '    </div>\n' +
        '</div>'
    ].join("");
    this.current_page = 1;

    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

        // Init photos gallery
        page_container.find(".photos-container").magnificPopup({
            delegate: "a.photo-picture",
            type: "image",
            closeOnContentClick: false,
            closeBtnInside: false,
            mainClass: "mfp-with-zoom mfp-img-mobile",
            image: {
                verticalFit: true,
                titleSrc: function(item) {
                    if (User.is_logged == true) {
                        return '<i class="fa fa-flag" data-value="photos" data-id="' + item.el.attr("data-id") + '" data-report="photo" style="color: #fff;"></i> ' + item.el.attr("data-title");
                    } else {
                        return item.el.attr("data-title");
                    }
                }
            },
            gallery: {
                enabled: true
            },
            zoom: {
                enabled: true,
                duration: 300,
                opener: function(element) {
                    return element;
                }
            }
        });

        page_container.find(".fa-heart").click(function() {
            if (loadmore == true) {
                var csrftoken = $("[name=csrftoken]").val();
                addPhotoLike($(this).attr("data-id"), csrftoken);
            }
        });

        // Load more photos
        page_container.find(".load-more-button button").click(function() {
          
            var csrftoken = $("[name=csrftoken]").val();
            var countdivs = $('.photo-container').length;
            Web.ajax_manager.post("/article/photos/more", {
                current_page: self.current_page,
                offset: countdivs,
                csrftoken: csrftoken
            }, function(result) {
                if (result.photos.length > 0) {
                    for (var i = 0; i < result.photos.length; i++) {
                        var photo_data = result.photos[i];
                        var photo_template = $(self.photo_template.replace(/{story}/g, photo_data.url).replace(/{photo._id}/g, photo_data.id).replace(/{photo.likes}/g, photo_data.likes).replace(/{photo.date.full}/g, photo_data.timestamp).replace(/{photo.date.min}/g, photo_data.timestamp).replace(/{creator.username}/g, photo_data.author).replace(/{creator.figure}/g, photo_data.look));
                        page_container.find(".photos-container").append(photo_template);
                        photo_template.fadeIn();

                        page_container.find(".fa-heart[data-id=" + photo_data.id + "]").click(function() {
                            addPhotoLike($(this).attr("data-id"), csrftoken);
                        });
                    }

                    self.current_page = result.current_page;
                }
            });
        });

        function addPhotoLike(id, csrftoken) {
            if (User.is_logged == true) {
                Web.ajax_manager.post("/article/photos/like", {
                    post: id,
                    csrftoken: csrftoken
                }, function(result) {
                    if (result.status == 'success') {
                        $('.fa-heart[data-id=' + id + ']').addClass("pulsateOnce");
                        $('.likes-count[data-id=' + id + ']').text(parseInt($('.likes-count[data-id=' + id + ']').text()) + 1);
                    }
                });
            } else {
                Web.notifications_manager.create("error", Locale.web_page_community_photos_login, Locale.web_page_community_photos_loggedout);
            }
        }
    };
}


function WebPageHomeInterface(main_page) {
    this.main_page = main_page;
    
    this.current_page = 1;

    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

    }
}

function WebPageRegistrationInterface(main_page) {
    this.main_page = main_page;
    this.gender = "male";
    this.clouds_interval = null;
    this.clouds_frame = 0;

    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

        page_container.find(".username").keyup(function() {
            self.username_availability($(this).val());
        });

        page_container.find(".tabs-container span").click(function() {
            if (!$(this).hasClass("selected"))
                self.update_avatar($(this).attr("data-avatar"));
        });

        page_container.find("select[name = 'gender'].selectric").selectric({
            theme: "web",
            labelBuilder: "{text}",
            onChange: function() {
                self.gender = $(this).val();
                self.update_avatar(1);
            }
        });


    }

    /*
    * Custom functions
    * */
    this.update_avatar = function(avatar) {
        var page_container = this.main_page.get_page_container();
        var avatars_preload = page_container.find(".avatars-preload");
        var avatar_preload = avatars_preload.find("." + this.gender + "-avatar" + avatar).attr("src");
        var avatar_look = avatars_preload.find("." + this.gender + "-avatar" + avatar).attr("data-look");

        page_container.find(".avatars-container input[name = 'figure']").val(avatar_look);
        page_container.find(".avatars-container .avatar-container img").attr("src", avatar_preload);
        page_container.find(".tabs-container span.selected").removeClass("selected");
        page_container.find(".tabs-container span[data-avatar = '" + avatar + "']").addClass("selected");

        this.update_clouds();
    };

    this.update_clouds = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();
        clearTimeout(this.clouds_interval);
        this.clouds_frame = 0;
        this.clouds_interval = setInterval(function() {
            self.clouds_frame++;
            page_container.find(".avatars-container .avatar-container").attr("data-random", self.clouds_frame);
            if (self.clouds_frame === 8) {
                clearTimeout(self.clouds_interval);
                self.clouds_frame = 0;
                page_container.find(".avatars-container .avatar-container").removeAttr("data-random");
            }
        }, 100);
    };


    this.username_availability = function(username) {
        var page_container = this.main_page.get_page_container();

        if (username.length > 2) {
            Web.ajax_manager.post("/settings/namechange/availability", {
                username: username
            }, function(result) {
                if (result.status !== "available") {
                    page_container.find(".username").css('border', '1px solid red');
                } else {
                    page_container.find(".username").css('border', '1px solid green');
                }
            });
        } else {
            page_container.find(".username").css('border', '1px solid red');
        }
    };

}

function WebPageShopInterface(main_page) {
    this.main_page = main_page;

    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();

        // Init type select
        page_container.find(".filter-content .selectric").selectric({
            theme: "web"
        });

        page_container.find(".offer-content").click(function() {
            $("#editor").css("height", "320px");
          
            page_container.find(".offers-container").css({"width": "50%", "margin-left": "150px"});
            page_container.find(".offer-container").css({"margin-left": "70px"});
          
            var orderId = $(this).data("id");
            var amount = $(this).data("amount");
            var currency = $(this).data("type");
            var description = $(this).data("description");
          
            var csrftoken = page_container.find("[name=csrftoken]").val();
            
            page_container.find(".offer-container").hide();
            page_container.find("#offer-" + orderId).show();
            page_container.find(".left-side .aside-title-content").html(amount + ' ' + currency);
          
            page_container.find(".right-side .aside-content").html(description);

            if (page_container.find(".paypal-buttons")[0]){
                return;
            }
          
            paypal.Buttons({
                createOrder: function(data, actions) {
                    return fetch('/shop/offers/createorder', {
                        method: 'post',
                        headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({orderId: orderId, csrftoken: csrftoken})
                    }).then(function(res) {
                        return res.json();
                    }).then(function(orderData) {
                        $(".payment-loader").show();
                        $(".offers-container").hide();
                        return orderData.id;
                    });
                },
                onError: function (err) {
                  $(".payment-decline").show();
                  $(".payment-loader").hide();
                  
                  Web.ajax_manager.post("/shop/offers/status", {
                      status: 'FAILED',
                      orderId: data.orderID,
                      csrftoken: csrftoken
                  });
                  
                  Web.notifications_manager.create("error", err, 'Error..');
                },
                onCancel: function(data) {
                    $(".payment-decline").show();
                    $(".payment-loader").hide();
                  
                     Web.ajax_manager.post("/shop/offers/status", {
                        status: 'CANCELD',
                        orderId: data.orderID,
                        csrftoken: csrftoken
                    });
                },
                onApprove: function(data, actions) {
                    return fetch('/shop/offers/captureorder', {
                        method: 'post',
                        headers: {
                          'Accept': 'application/json',
                          'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({orderId: data.orderID, offerId: orderId, csrftoken: csrftoken})
                    }).then(function(res) {
                        return res.json();
                    }).then(function(orderData) {
         
                        var errorDetail = Array.isArray(orderData.details) && orderData.details[0];

                        if (errorDetail && errorDetail.issue === 'INSTRUMENT_DECLINED') {
                            return actions.restart(); 
                        }

                        if (errorDetail) {
                            Web.notifications_manager.create("error", 'Sorry, your transaction could not be processed.', 'Error..');
                        }

                        Web.ajax_manager.post("/shop/offers/validate", {
                            orderId: orderData.id,
                            csrftoken: csrftoken
                        });
                      
                        $(".payment-accept").show();
                        $(".payment-loader").hide();
                        
                        var myAudio = new Audio('/assets/images/cash.mp3');
                        myAudio.play();
                    });
                }
            }).render('.offers-container');
        });

        page_container.find(".selectric").change(function() {
            Web.pages_manager.load("shop/" + page_container.find(".filter-content .selectric").val() + "/lang");
        });
    };
}

function WebPageShopOffersInterface(main_page) {
    this.main_page = main_page;
    this.offer_id = null;
    this.amount = 0;
    this.country = "nl";
    this.payments = {
        "Neosurf": {
            name: Locale.web_page_shop_offers_neosurf_name,
            description: Locale.web_page_shop_offers_neosurf_description,
            class: "neosurf",
            dialog: Locale.web_page_shop_offers_neosurf_dialog
        },
        "Paypal": {
            name: Locale.web_page_shop_offers_paypal_name,
            description: Locale.web_page_shop_offers_paypal_description,
            class: "paypal",
            dialog: Locale.web_page_shop_offers_paypal_dialog
        },
        "SMS": {
            name: Locale.web_page_shop_offers_sms_name,
            description: Locale.web_page_shop_offers_sms_description,
            class: "sms-plus",
            dialog: Locale.web_page_shop_offers_sms_dialog
        },
        "Audiotel": {
            name: Locale.web_page_shop_offers_audiotel_name,
            description: Locale.web_page_shop_offers_audiotel_description,
            class: "audiotel",
            dialog: Locale.web_page_shop_offers_audiotel_dialog
        }
    };
    this.payment_template = [
        '<article class="default-section offer-payment flex-container flex-vertical-center">\n' +
        '    <div class="payment-image"></div>\n' +
        '    <div class="payment-description"></div>\n' +
        '    <div class="payment-button">\n' +
        '        <button type="button" class="rounded-button blue">Kies</button>\n' +
        '    </div>\n' +
        '</article>'
    ].join("");

    /*
     * Generic function
     * */
    this.init = function() {
        var self = this;
        var page_container = this.main_page.get_page_container();
        var url;

        if (!User.is_logged)
            return;

        // Init offers
        this.offer_id = page_container.find("#offer-id").val();
        this.amount = page_container.find("#offer-amount").val();
        this.country = page_container.find("#offer-country").val();
        this.shop_type = page_container.find("#shop-type").val();

        if (this.shop_type == "selly.io") {
            //hier komt selly.
        } else {

            $.ajax({
                type: "get",
                url: "https://api.dedipass.com/v1/pay/rates?key=" + this.offer_id,
                dataType: "json"
            }).done(function(solutions) {
                if (page_container.find(".loading-solutions").length > 0)
                    page_container.find(".loading-solutions").remove();

                var solutionsSorted = solutions.sort(function(a, b) {
                    var x = a.ordersolution;
                    var y = b.ordersolution;
                    return x < y ? -1 : x > y ? 1 : 0;
                });

                for (var i = 0; i < solutionsSorted.length; i++) {
                    var solution = solutionsSorted[i];

                    if (!self.payments.hasOwnProperty(solution.solution))
                        continue;

                    if (solution.country.iso !== "all" && solution.country.iso !== self.country)
                        continue;

                    var template = $(self.payment_template);
                    template.attr("data-id", i);
                    template.addClass(self.payments[solution.solution].class);
                    template.find(".payment-description").html("<h4>" + self.payments[solution.solution].name + "</h4>" + self.payments[solution.solution].description);

                    page_container.find(".shop-offer").append(template);

                    template.find(".payment-button button").click(function() {
                        var solution = solutionsSorted[$(this).closest(".offer-payment").attr("data-id")];
                        self.open_solution_payment(solution);
                    });
                }
            });
        }
    };

    /*
     * Custom functions
     * */
    this.open_solution_payment = function(solution) {
        var self = this;
        var payment_solution = this.payments[solution.solution];
        var template = [
            '<div class="payment-popup zoom-anim-dialog">\n' +
            '    <div class="main-step">' +
            '        <h3 class="title">' + Locale.web_page_shop_offers_pay_with + ' ' + payment_solution.name + '</h3>' +
            '        <h5 class="subtitle">' + this.amount + ' ' + Locale.web_page_shop_offers_points_for + ' €' + number_format(solution.user_price, 2, ",", " ") + '</h5>' +
            '        <h5>1. ' + Locale.web_page_shop_offers_get_code + '</h5>' +
            '        ' + payment_solution.dialog +
            '        <div class="solution-details"></div>' +
            '        <div class="obtain-code"></div>' +
            '        <h5>2. ' + Locale.web_page_shop_offers_fill_code + '</h5>' +
            '        ' + Locale.web_page_shop_offers_fill_code_desc + '' +
            '        <div class="row">' +
            '            <div class="column-2">' +
            '                <input type="text" class="rounded-input blue-active code" placeholder="Code...">' +
            '            </div>' +
            '            <div class="column-2">' +
            '                <button class="rounded-button blue plain submit">' + Locale.web_page_shop_offers_submit + '</button>' +
            '            </div>' +
            '        </div>' +
            '    </div>' +
            '    <div class="success-step">' +
            '        <h3 class="title">' + Locale.web_page_shop_offers_success + '</h3>' +
            '        ' + Locale.web_page_shop_offers_received + ' <span></span> ' + Locale.web_page_shop_offers_received2 + '' +
            '        <img src="/assets/images/web/pages/shop/credits-success.png" alt="' + Locale.web_page_shop_offers_success + '">' +
            '        <button class="rounded-button lightgreen plain">' + Locale.web_page_shop_offers_close + '</button>' +
            '    </div>' +
            '    <div class="error-step">' +
            '        <h3 class="title">' + Locale.web_page_shop_offers_failed + '</h3>' +
            '        ' + Locale.web_page_shop_offers_failed_desc + '' +
            '        <img src="/assets/images/web/pages/shop/credits-error.png" alt="' + Locale.web_page_shop_offers_failed + '">' +
            '        <button class="rounded-button red plain">' + Locale.web_page_shop_offers_back + '</button>' +
            '    </div>' +
            '</div>'
        ].join("");

        var dialog = $(template);
        var details_template = null;
        var obtain_template = null;

        if (payment_solution.class === "neosurf")
            details_template = Locale.web_page_shop_offers_no_card + " <a href=\"http://www.neosurf.com/fr_FR/application/findcard\" target=\"_blank\">" + Locale.web_page_shop_offers_no_card2 + "</a>.";

        if (details_template !== null)
            dialog.find(".solution-details").html(details_template);
        else
            dialog.find(".solution-details").remove();

        if (payment_solution.class === "sms-plus") {
            obtain_template = [
                '<div class="sms-container ' + (this.country === "fr" ? "fr" : "") + '">' +
                '    <span class="keyword">' + solution.keyword + '</span> ' + Locale.web_page_shop_offers_to + ' <span class="shortcode">' + solution.shortcode + '</span>' +
                '    <div class="mention">' + solution.mention + '</div>' +
                '</div>'
            ].join("");
        } else if (payment_solution.class === "audiotel") {
            obtain_template = [
                '<div class="audiotel' + (this.country !== "be" ? "fr" : "be") + '-container">' +
                '    ' + solution.phone +
                '    <div class="mention">' + solution.mention + '</div>' +
                '</div>'
            ].join("");
        } else if (!isEmpty(solution.link)) {
            obtain_template = [
                '<button class="rounded-button blue">' + Locale.web_page_shop_offers_buy_code + '</button>'
            ].join("");
        }

        if (obtain_template !== null)
            dialog.find(".obtain-code").html(obtain_template);

        if (!isEmpty(solution.link)) {
            dialog.find(".obtain-code button").click(function() {
                self.open_modal(solution.link);
            });
        }

        dialog.find(".code").keypress(function(e) {
            if (e.keyCode !== 13)
                return null;

            if (!isEmpty($(this).val()))
                self.submit_code(solution, $(this).val());
        });

        dialog.find(".submit").click(function() {
            var code = dialog.find(".code").val();

            if (!isEmpty(code))
                self.submit_code(solution, code);
        });

        dialog.find(".error-step button").click(function() {
            self.show_main_step();
        });

        dialog.find(".success-step button").click(function() {
            $.magnificPopup.close();
        });

        $.magnificPopup.open({
            closeOnBgClick: false,
            items: {
                src: dialog,
                type: "inline"
            }
        });
    };

    this.open_modal = function(link) {
        window.open(link, "Laden...", "toolbar=0,scrollbars=1,location=0,statusbar=0,menubar=0,resizable=1,width=600,height=550,left=420,top=150");
    };

    this.submitted = false;
    this.submit_code = function(solution, code) {
        if (this.submitted)
            return null;

        this.disable_button();

        var self = this;
        $.ajax({
            type: "get",
            url: "https://api.dedipass.com/v1/pay/?key=" + this.offer_id + "&rate=AUTORATE&code=" + code + "&tokenize",
            dataType: "json"
        }).done(function(result) {
            if (result.status === "success") {
                Web.ajax_manager.post("/shop/offers/validate", {
                    offer_id: self.offer_id,
                    code: code,
                    price: solution.user_price
                }, function(data) {
                    if (data.status === "success")
                        self.show_success_step(data.amount);
                    else
                        self.show_error_step();
                });
            } else
                self.show_error_step();
        });
    };

    this.disable_button = function() {
        var dialog = $("body").find(".payment-popup");
        var submit_button = dialog.find(".main-step .submit");

        this.submitted = true;
        submit_button.text("Laden...").prop("disabled", true);
    };

    this.enable_button = function() {
        var dialog = $("body").find(".payment-popup");
        var submit_button = dialog.find(".main-step .submit");

        this.submitted = false;
        submit_button.text("Valideren..").prop("disabled", false);
    };

    this.show_main_step = function() {
        this.enable_button();
        var dialog = $("body").find(".payment-popup");

        dialog.find(".main-step").show();
        dialog.find(".success-step").hide();
        dialog.find(".error-step").hide();
    };

    this.show_success_step = function(amount) {
        this.enable_button();
        var dialog = $("body").find(".payment-popup");

        dialog.find(".main-step").hide();
        dialog.find(".success-step span").text(amount);
        dialog.find(".success-step").show();
        dialog.find(".error-step").hide();
    };

    this.show_error_step = function() {
        this.enable_button();
        var dialog = $("body").find(".payment-popup");

        dialog.find(".main-step").hide();
        dialog.find(".success-step").hide();
        dialog.find(".error-step").show();
    };
}

