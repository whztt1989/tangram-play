import React from 'react';
import Map from './Map';
import Editor from './Editor';
import RefreshButton from './RefreshButton';

import { initTangramPlay } from '../tangram-play';

/**
 * This class is identical to normal Tangram Play but represents an embedded version of the app
 */
export default class AppEmbedded extends React.Component {
    componentDidMount() {
        initTangramPlay();
    }

    shouldComponentUpdate() {
        return false;
    }

    render() {
        return (
            <div className="workspace-container">
                <div id="draggable-container">
                    <div id="draggable-container-child" />
                </div>

                <div>
                    <Map panel={false} />
                    <Editor />
                </div>

                <RefreshButton />
            </div>
        );
    }
}
