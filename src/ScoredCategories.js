/**
 * Adds a table to category pages showing the pages with the top 10 scores
 *
 * @author: Helder (https://github.com/he7d3r)
 * @license: CC BY-SA 3.0 <https://creativecommons.org/licenses/by-sa/3.0/>
 */
( function ( mw, $ ) {
	'use strict';
	var pages,
		model = 'damaging',
		scoreName = model + 'Score',
		oresUrl = '//ores.wmflabs.org/scores/' + mw.config.get( 'wgDBname' ) + '/',
		max = 10;
	function showTable( pages ) {
		var i, page, $row, score, revid,
			$table = $( '<table><tbody><tr><th>Score</th><th>Page</th></tr></tbody></table>' )
				.addClass( 'wikitable sortable' ),
			$tbody = $table.find( 'tbody' );
		for ( i = 0; i < pages.length; i++ ) {
			page = pages[ i ];
			revid = page.revisions[ 0 ].revid;
			score = ( 100 * page[ scoreName ] ).toFixed( 0 );
			$row = $( '<tr>' )
				.append(
					$( '<td>' ).append(
						$( '<a>' )
							.attr(
								'href',
								oresUrl + '?models=' + model +
									'&revids=' + revid
							)
							.text( score + '%' )
          ),
					$( '<td>' ).append(
						$( '<a>' )
							.attr( 'href', mw.util.getUrl( page.title, {
								diff: revid
							} ) )
							.text( page.title )
					)
				);
			$tbody.append( $row );
		}
		$( '#mw-content-text' ).prepend(
			$table.tablesorter()
		);
	}
	function getTopScores( data ) {
		$.each( pages, function ( i, page ) {
			var score = data[ page.revisions[ 0 ].revid ][ model ];
			if ( !score || score.error ) {
				// return null;
				page[ scoreName ] = 0;
			} else {
				page[ scoreName ] = score.probability[ 'true' ];
			}
		} );
		pages = pages.sort( function ( a, b ) {
			return b[ scoreName ] - a[ scoreName ];
		} ).slice( 0, max );
		showTable( pages );
	}

	function getScores( data ) {
		var revids;
		pages = data.query && data.query.pages;
		if ( !pages ) {
			return
		}
		revids = $.map( pages, function ( page ) {
			return page.revisions[ 0 ].revid;
		} );
		$.ajax( {
			url: oresUrl,
			data: {
				models: model,
				// TODO: Prevent this URL from having more than 2000 characters
				revids: revids.join( '|' )
			},
			dataType: 'jsonp'
		} )
		.done( getTopScores );
	}

	function getCategoryMembers() {
		var api = new mw.Api();
		api.get( {
			prop: 'revisions',
			rvprop: 'ids',
			generator: 'categorymembers',
			gcmtitle: mw.config.get( 'wgPageName' ),
			formatversion: 2,
			// FIXME: add continuation!
			gcmlimit: 150
		} )
		.done( getScores );
	}

	if ( mw.config.get( 'wgNamespaceNumber' ) === 14 &&
			mw.config.get( 'wgAction' ) === 'view'
	) {
		$.when(
			mw.loader.using( [ 'mediawiki.api', 'mediawiki.util', 'jquery.tablesorter' ] ),
			$.ready
		).then( getCategoryMembers );
	}

}( mediaWiki, jQuery ) );
