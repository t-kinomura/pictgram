(function(){$(function(){return $("img").on("click",function(){var e;return $(".enlargement-image").toggleClass("active"),e=$(this).clone(),$(".enlargement-image").append(e)}),$(".enlargement-image").on("click",function(){return $(".enlargement-image").toggleClass("active"),$(".enlargement-image img").remove()})})}).call(this);