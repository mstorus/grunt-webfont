/**
 * grunt-webfont: Node.js engine
 *
 * @requires ttfautohint
 * @author Artem Sapegin (http://sapegin.me)
 */

/*jshint node:true, laxbreak:true, latedef:false */
module.exports = function(grunt, o, done) {
	'use strict';

	var fs = require('fs');
	var path = require('path');
	var async = require('async');
	var _ = require('lodash');
	var svgicons2svgfont = require('svgicons2svgfont');
	var svg2ttf = require('svg2ttf');
	var ttf2woff = require('ttf2woff');
	var ttf2eot = require('ttf2eot');

	// @todo Append hashes
	// @todo Autohint TTF
	// @todo Fix line height, kerning, sizes, etc. (see generate.py)
	// @todo SVGO for SVG font and for every glyph (?)
	// @todo Tweak SVG (as in FF script)
	// @todo Make everything works in memory (don’t write SVG font to file and read it back)
	// @todo Ligatures

	var svgFontPath = fontPath('svg');
	var ttfFont;

	var result = {
		fontName: o.fontName,
		glyphs: [],
		codepoints: []
	};


	// Run!
	async.waterfall([
		svgFilesToSvgFont,
		svgFontToTtfFont,
		ttfFontToWoffFont,
		ttfFontToEotFont,
		allDone
	]);


	// Convert SVG files to SVG font
	function svgFilesToSvgFont(done) {
		svgicons2svgfont(o.files, svgFontPath, {
			fontName: o.fontName,
			callback: function(glyphs) {
				result.glyphs = _.pluck(glyphs, 'name');
				result.codepoints = _.pluck(glyphs, 'codepoint');
				done();
			}
		});
	}

	// Create TTF font
	function svgFontToTtfFont(done) {
		ttfFont = svg2ttf(fs.readFileSync(svgFontPath, {encoding: 'utf-8'}), {});
		ttfFont = new Buffer(ttfFont.buffer);
		fs.writeFileSync(fontPath('ttf'), ttfFont);
		done();
	}

	// Create WOFF font
	function ttfFontToWoffFont(done) {
		var woff = ttf2woff(new Uint8Array(ttfFont), {});
		woff = new Buffer(woff.buffer);
		fs.writeFileSync(fontPath('woff'), woff);
		done();
	}

	// Create EOT font
	function ttfFontToEotFont(done) {
		var eot = ttf2eot(new Uint8Array(ttfFont));
		eot = new Buffer(eot.buffer);
		fs.writeFileSync(fontPath('eot'), eot);
		done();
	}

	function allDone() {
		done(result);
	}


	//
	// Helpers
	//

	function fontPath(type) {
		return path.join(o.dest, o.fontName + '.' + type);
	}
};