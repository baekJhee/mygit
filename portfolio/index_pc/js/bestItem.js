$(function(){
    $("#item").css("width",1220*$("#item>ul>li").length);
    $("#item>ul>li:last").prependTo("#item>ul");
    $("#item").css("margin-left","-1220px");
    $("#prevBtn").click(function(){
        $("#item").animate({
            marginLeft :"+=1220px"
        },"slow",function(){
            $("#item>ul>li:last").prependTo("#item>ul");
            $("#item").css("margin-left","-1220px");
        })
    })
    $("#nextBtn").click(function(){
        $("#item").animate({
            marginLeft :"-=1220px"
        },"slow",function(){
            $("#item>ul>li:first").appendTo("#item>ul");
            $("#item").css("margin-left","-1220px");
        })
    })
})