$(function(){
    $("article>div#content>div#allpage").css("width",1300*$("article>div#content>div#allpage>ul").length);
    $("article>div#content>div#allpage>ul:first").prependTo("article>div#content>div#allpage");
    $("article>div#content>div#allpage").css("margin-left","-1310px");
    $("div#prev").click(function(){
        $("div#prev,div#next").hide();
        $("article>div#content>div#allpage").animate({
            marginLeft : "+=1310px"
        },"slow",function(){
            $("article>div#content>div#allpage>ul:last").prependTo("article>div#content>div#allpage");
            $("article>div#content>div#allpage").css("margin-left","-1310px");
            $("div#prev,div#next").show();
        })
    })
    $("div#next").click(function(){
        $("div#prev,div#next").hide();
        $("article>div#content>div#allpage").animate({
            marginLeft : "-=1310px"
        },"slow",function(){
            $("article>div#content>div#allpage>ul:first").appendTo("article>div#content>div#allpage");
            $("article>div#content>div#allpage").css("margin-left","-1310px");
            $("div#prev,div#next").show();
        })
    })
})