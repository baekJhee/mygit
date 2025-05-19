$(function(){
    //메뉴
    $("header div#ham").click(function(){
        $("#subWrap").animate({right:0})
    })
    $("#out").click(function(){
        $("#subWrap").animate({right:"-100%"})
    })
    $("#subm>ul ul").hide();
    $("#subm>ul>li>a").click(function(){
        $(this).parent().find("ul").slideToggle("normal");
        $(this).parent().siblings().find("ul").slideUp("normal");
    })
    //베너 오토
    var num = 0;
    function opaAni(count){
        $("main li, #btns a").removeClass("on")
        $("main li:eq("+count+"), #btns a:eq("+count+")").addClass("on");
    }
    var autoAni = setInterval(function(){
        if(num<$("main li").length-1) num++; else num = 0;
        opaAni(num)
    },3000)
    $("#btns a").click(function(){
        clearInterval(autoAni);
        num = $(this).index();
        opaAni(num);
        autoAni = setInterval(function(){
            if(num<$("main li").length-1) num++; else num = 0;
            opaAni(num)
        },3000)
    })
    //제휴브랜드
    $("#brand>div>div").click(function(){
        $("#brand>div>div").removeClass("op1")
        $(this).addClass("op1")
    })
    //베스트 슬라이드
    $("#item").css("width",339*$("#item>ul>li").length);
    $("#item>li>li:last").prependTo("#item>ul");
    $("#item").css("margin-left","-270px");
    $("#be_prev").click(function(){
        $("#item").animate({
            marginLeft : "+=270px"
        },"slow",function(){
            $("#item>ul>li:last").prependTo("#item>ul");
            $("#item").css("margin-left","-270px");
        })
    })                  
    $("#be_next").click(function(){
        $("#item").animate({
            marginLeft : "-=270px"
        },"slow",function(){
            $("#item>ul>li:first").appendTo("#item>ul");
            $("#item").css("margin-left","-270px");
        })
    })
    //포스터 멘트
    $(window).scroll(function(){
        var sct= $(window).scrollTop();
        if(sct>3200){
            $("div#bgPoster img").addClass("on");
        }else{
            $("div#bgPoster img").removeClass("on");
        }
    })
    // 코카프 클릭반응
    $("#history li").click(function(){
        var bigImg = $(this).find("img").attr("src");
        $("#history div img").attr("src",bigImg);
    })     
})