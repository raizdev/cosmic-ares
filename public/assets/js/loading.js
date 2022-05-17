var SiteLoading;
var PageLoading;
var Config;

$(function ()
{
    SiteLoading = new SiteLoadingInterface();
    SiteLoading.init();
    SiteLoading.load_file(0);
    PageLoading = new PageLoadingInterface();
    Config = new Config();
    Config.getConfig();
});

function Config ()
{
    var self = this;

    this.data = null;

    this.getConfig = function ()
    {
        $.getJSON('/config', function(result) {
            self.data = result.data;
        });

        this.setConfig();
    }

    this.setConfig = function () {
        setTimeout(() => {
            this.getConfig();
            $(".online-user .count").text(self.data.online_users);
        }, 25000);
    }
}

function SiteLoadingInterface()
{
    this.files = [
        "functions",
        "web.pages",
        "web.core"
    ];

    this.loaded_files = 0;
    this.total_files = 0;
    this.loading_container = null;
    this.cache_id = null;

    this.init = function ()
    {
        console.log("Cosmic Forward - All rights reserved");
        this.total_files = this.files.length;
        this.loading_container = $(".loading-container");

        this.cache_id = (new Date().getTime() + Math.floor((Math.random() * 10000) + 1)).toString(16);
    }

    this.load_file = function (file_id)
    {
        var self = this;
        var file_name = this.files[file_id];
        var script = document.createElement("script");
        $("body").append(script);
        script.onload = function ()
        {
            self.loaded_files++;

            var percent = Math.floor(self.loaded_files / self.total_files * 100);

            self.loading_container.find(".c100").attr("class", "c100 p" + percent + " center");

            if (file_id + 1 < self.total_files)
            {
                file_id++;
                self.load_file(file_id);
            }
            else
            {
                setTimeout(function ()
                {
                    self.close_loading();
                }, 100);
            }
        };
        script.onerror = function ()
        {
            console.log("Oops, file \"" + file_name + "\" not found.");
            self.write_bodytext("Oops, something went wrong. <a href=\"javascript:window.location.reload();\">Reload the page</a>.");
        };
        script.src = "/assets/js/" + file_name + ".js?" + this.cache_id;
    };

    this.write_bodytext = function (text)
    {
        this.loading_container.find(".loading-bodytext").html(text);
    };

    this.close_loading = function ()
    {
        this.loading_container.fadeOut(1000, function ()
        {
            $(this).remove();
        });
    };
}

function PageLoadingInterface()
{
    this.show = function ()
    {
        $(".page-loading").stop().fadeIn(500);
    };

    this.hide = function ()
    {
        $(".page-loading").stop().fadeOut(500);
    };
}