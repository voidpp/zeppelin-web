
var Graphics = {
	drawers: {
		music: {
			play: function(p_ctx, p_rect) {
				p_ctx.beginPath();
				p_ctx.moveTo(p_rect.x+p_rect.w*0.15, p_rect.y);
				p_ctx.lineTo(p_rect.x+p_rect.w*0.85, p_rect.y+p_rect.h/2);
				p_ctx.lineTo(p_rect.x+p_rect.w*0.15, p_rect.y+p_rect.h);
				p_ctx.closePath();
				p_ctx.fill();
			},
			stop: function(p_ctx, p_rect) {
				p_ctx.fillRect(p_rect.x+p_rect.w*0.1,p_rect.y+p_rect.h*0.1,p_rect.w*0.8,p_rect.h*0.8);
			},
			pause: function(p_ctx, p_rect) {
				p_ctx.fillRect(p_rect.x+p_rect.w*0.15,p_rect.y+p_rect.h*0.05,p_rect.w*0.25,p_rect.h*0.9);
				p_ctx.fillRect(p_rect.x+p_rect.w*0.60,p_rect.y+p_rect.h*0.05,p_rect.w*0.25,p_rect.h*0.9);
			},
			next_track: function(p_ctx, p_rect) {
			},
			prev_track: function(p_ctx, p_rect) {
			},
		},
	},
}