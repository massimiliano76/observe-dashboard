import React from 'react';
import styled from 'styled-components';
import mapboxgl from 'mapbox-gl';
import bbox from '@turf/bbox';
import { PropTypes as T } from 'prop-types';
import { apiUrl, mapboxAccessToken, environment } from '../../config';
import { formatDateTimeExtended, startCoordinate } from '../../utils';
import { connect } from 'react-redux';
import * as actions from '../../redux/actions/traces';
import {
  wrapApiResult,
  getFromState,
  deleteItem,
  updateItem
} from '../../redux/utils';

import App from '../common/app';
import {
  Inpage,
  InpageBody,
  InpageTitle,
  InpageHeadline,
  InpageBodyInner,
  InpageBackLink
} from '../common/inpage';
import UhOh from '../uhoh';
import Prose from '../../styles/type/prose';
import Button from '../../styles/button/button';
import Form from '../../styles/form/form';
import FormLabel from '../../styles/form/label';
import FormInput from '../../styles/form/input';
import {
  ContentWrapper,
  Infobox,
  ActionButtonsWrapper
} from '../common/view-wrappers';
import { LinkToOsmProfile } from '../common/link';
import toasts from '../common/toasts';
import {
  confirmDeleteItem,
  confirmJosmExport
} from '../common/confirmation-prompt';
import { showGlobalLoading, hideGlobalLoading } from '../common/global-loading';

// Mapbox access token
mapboxgl.accessToken = mapboxAccessToken;

const Map = styled.div``;

const EditButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-left: 45%;
`;

class Traces extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      mapLoaded: false,
      editing: false,
      newDescription: ''
    };

    this.deleteTrace = this.deleteTrace.bind(this);
    this.updateTrace = this.updateTrace.bind(this);
    this.exportToJosm = this.exportToJosm.bind(this);
    this.renderActionButtons = this.renderActionButtons.bind(this);
  }

  async componentDidMount () {
    showGlobalLoading();

    // Fetch trace from the API
    const { traceId } = this.props.match.params;
    await this.props.fetchTrace(traceId);

    hideGlobalLoading();
  }

  componentDidUpdate () {
    const { mapLoaded } = this.state;

    // Bypass if map is already loaded
    if (mapLoaded) return;

    // Check if geometry is available
    const { isReady, hasError, getData } = this.props.trace;
    if (!isReady() || hasError()) return null;
    const { geometry } = getData();

    // Add Map component
    this.map = new mapboxgl.Map({
      container: this.mapContainer,
      style: 'mapbox://styles/mapbox/streets-v9',
      interactive: false,
      attributionControl: false,
      bounds: bbox(geometry),
      fitBoundsOptions: { padding: 20 }
    }).addControl(
      new mapboxgl.AttributionControl({
        compact: false
      })
    );

    // Add trace when map is fully loaded
    const self = this;
    this.map.on('load', function () {
      self.map.addLayer({
        id: 'trace',
        type: 'line',
        source: {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: geometry
          }
        }
      });
      self.setState({ mapLoaded: true });
    });
  }

  async deleteTrace (e) {
    e.preventDefault();

    // Confirm delete
    const { traceId } = this.props.match.params;
    const { result } = await confirmDeleteItem('trace', traceId);

    // When delete is confirmed
    if (result) {
      showGlobalLoading();

      try {
        // Make delete request
        await this.props.deleteTrace();

        // Redirect to index if successful
        this.props.history.push(`/traces`);

        // Show success toast.
        toasts.info('Trace was successfully deleted.');
      } catch (error) {
        // Show error toast.
        toasts.error('An error occurred, trace was not deleted.');
      }

      hideGlobalLoading();
    }
  }

  async updateTrace (e) {
    e.preventDefault();

    // Confirm delete
    const { traceId } = this.props.match.params;
    // const { result } = await confirmUpdateItem('trace', traceId);
    const result = true;

    // When delete is confirmed
    if (result) {
      showGlobalLoading();

      try {
        const { newDescription } = this.state;

        // Make delete request
        await this.props.updateTrace(traceId, { description: newDescription });

        // Show success toast.
        toasts.info('Trace was successfully updated.');

        // Disable editing state
        this.setState({ editing: false });
      } catch (error) {
        // Show error toast.
        toasts.error('An error occurred, trace was not updated.');
      }

      hideGlobalLoading();
    }
  }

  async exportToJosm (e) {
    e.preventDefault();

    const { result } = await confirmJosmExport();

    // When delete is confirmed, open JOSM Remote Control link in a
    // separate window
    if (result) {
      const { traceId } = this.props.match.params;
      const gpxUrl = `${apiUrl}/traces/${traceId}.gpx`;
      window.open(`http://127.0.0.1:8111/import?url=${gpxUrl}`, '_blank');
    }
  }

  renderContent () {
    const { isReady, hasError, getData } = this.props.trace;

    if (!isReady()) return null;
    if (hasError()) return <UhOh />;

    // Get trace data
    const { properties: trace, geometry } = getData();

    return (
      <>
        <InpageHeadline>
          <InpageBackLink to='/traces'>Back to traces</InpageBackLink>
          <InpageTitle>Trace {trace.id}</InpageTitle>
        </InpageHeadline>
        <ContentWrapper>
          {this.renderMap(geometry)}
          {this.renderInfobox(trace, geometry)}
        </ContentWrapper>
        {this.renderActionButtons(trace)}
      </>
    );
  }

  renderMap () {
    return (
      <Map>
        {mapboxgl.supported() ? (
          <div
            ref={r => {
              this.mapContainer = r;
            }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className='mapbox-no-webgl'>
            <p>WebGL is not supported or disabled.</p>
          </div>
        )}
      </Map>
    );
  }

  renderInfobox (trace, geometry) {
    const { editing, newDescription } = this.state;
    return (
      <Infobox>
        <Form onSubmit={this.updateTrace}>
          <FormLabel>id</FormLabel>
          <p>{trace.id}</p>
          <FormLabel>Description</FormLabel>
          {editing ? (
            <FormInput
              ref={this.descriptionInput}
              type='text'
              size='large'
              id='input-text-a'
              placeholder='Enter a description'
              value={newDescription}
              onChange={e => this.setState({ newDescription: e.target.value })}
              autoFocus
            />
          ) : (
            <p>{trace.description}</p>
          )}

          <FormLabel>Length</FormLabel>
          <p>{trace.length}</p>
          <FormLabel>Owner</FormLabel>
          <p>
            <LinkToOsmProfile osmDisplayName={trace.ownerDisplayName} />
          </p>
          <FormLabel>Start coordinate</FormLabel>
          <p>{startCoordinate(geometry)}</p>
          <FormLabel>Recorded at</FormLabel>
          <p>{formatDateTimeExtended(trace.recordedAt)}</p>
          <FormLabel>Uploaded at</FormLabel>
          <p>{formatDateTimeExtended(trace.uploadedAt)}</p>
          <FormLabel>Updated at</FormLabel>
          <p>{formatDateTimeExtended(trace.updatedAt)}</p>
          {editing && (
            <EditButtons>
              <Button
                variation='danger-raised-light'
                title='Cancel this action'
                size='large'
                useIcon='circle-xmark'
                onClick={() => this.setState({ editing: false })}
              >
                Cancel
              </Button>
              <Button
                variation='primary-raised-dark'
                title='Confirm this action'
                size='large'
                useIcon='circle-tick'
                onClick={this.updateTrace}
              >
                Confirm
              </Button>
            </EditButtons>
          )}
        </Form>
      </Infobox>
    );
  }

  renderActionButtons (trace) {
    const { editing } = this.state;
    const { ownerId, description } = trace;

    const { osmId: userId, isAdmin } = this.props.authenticatedUser.getData();

    return (
      <ActionButtonsWrapper>
        {(isAdmin || userId === ownerId) && (
          <>
            <Button
              useIcon='trash-bin'
              variation='danger-raised-light'
              size='xlarge'
              onClick={this.deleteTrace}
              disabled={editing}
            >
              Delete
            </Button>
            <Button
              useIcon='pencil'
              variation='primary-raised-semidark'
              size='xlarge'
              onClick={() =>
                this.setState({ editing: true, newDescription: description })}
              disabled={editing}
            >
              Edit Metadata
            </Button>
          </>
        )}
        <Button
          useIcon='share'
          variation='base-raised-semidark'
          size='xlarge'
          onClick={this.exportToJosm}
          disabled={editing}
        >
          Export to JOSM
        </Button>
        <Button
          useIcon='download'
          variation='primary-raised-dark'
          size='xlarge'
          disabled={editing}
        >
          Download
        </Button>
      </ActionButtonsWrapper>
    );
  }

  render () {
    return (
      <App pageTitle='Traces'>
        <Inpage>
          <InpageBody>
            <InpageBodyInner>
              <Prose>{this.renderContent()}</Prose>
            </InpageBodyInner>
          </InpageBody>
        </Inpage>
      </App>
    );
  }
}

if (environment !== 'production') {
  Traces.propTypes = {
    deleteTrace: T.func,
    updateTrace: T.func,
    fetchTrace: T.func,
    history: T.object,
    match: T.object,
    trace: T.object,
    authenticatedUser: T.object
  };
}

function mapStateToProps (state, props) {
  const { traceId } = props.match.params;
  const { individualTraces, authenticatedUser } = state;

  return {
    trace: wrapApiResult(getFromState(individualTraces, traceId)),
    authenticatedUser: wrapApiResult(authenticatedUser),
    deleteTrace: () => deleteItem(state, 'traces', traceId)
  };
}

function dispatcher (dispatch) {
  return {
    fetchTrace: (...args) => dispatch(actions.fetchTrace(...args)),
    updateTrace: (...args) => dispatch(actions.updateTrace(...args))
  };
}

export default connect(mapStateToProps, dispatcher)(Traces);
