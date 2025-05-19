$(document).ready(function(){
    $("#right,#left").fadeOut("fast");
    $(".on").hover(function(){
        $("#right,#left").fadeIn("slow");
    },function(){
        $("#right,#left").fadeOut("slow");
    })
    
    var wd = $("section:first>div>ul>li").width()+5;
    var maxSize = wd*$("section:first>div>ul>li").length;
    //alert(maxSize)
    $("section.hover>div>ul").width(maxSize);
    $("section.hover>div>ul>li:last").prependTo("section:first>div>ul");
    $("section.hover>div>ul").css("margin-left",-wd);
    $("#right").click(function(){
        $("section.hover>div>ul").animate({
            marginLeft:parseInt($("section.hover>div>ul").css("margin-left"))-wd+"px"
        },function(){
            $("section.hover>div>ul>li:first").appendTo("section:first>div>ul");
            $("section.hover>div>ul").css("margin-left",-wd)
        })
    })
    $("#left").click(function(){
        $("section.hover>div>ul").animate({
            marginLeft:parseInt($("section.hover>div>ul").css("margin-left"))+wd+"px"
        },function(){
            $("section.hover>div>ul>li:last").prependTo("section:first>div>ul");
            $("section.hover>div>ul").css("margin-left",-wd)
        })
    })


})