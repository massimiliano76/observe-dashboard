import React, { Component } from 'react';
import styled from 'styled-components';
import { PropTypes } from 'prop-types';
import c from 'classnames';
import { connect } from 'react-redux';

import MetaTags from './meta-tags';
import PageHeader from './page-header';
import PageFooter from './page-footer';

import GlobalLoading from '../common/global-loading';

import { appTitle, appDescription } from '../../config';

const Page = styled.div`
  display: grid;
  height: 100vh;
  max-height: 100vh;
  grid-template-rows: 4rem 1fr;
`;

const PageBody = styled.main`
  padding: 0;
  margin: 0;
`;

class App extends Component {
  render () {
    const { pageTitle, className, hideFooter, children } = this.props;
    const title = pageTitle ? `${pageTitle} — ` : '';
    return (
      <Page className={c('page', className)}>
        <GlobalLoading />
        <MetaTags title={`${title}${appTitle} `} description={appDescription} />
        <PageHeader pageTitle='Observe' />
        <PageBody role='main'>
          {children}
        </PageBody>
        <PageFooter isHidden={hideFooter} credits='Made with 🧡 by Development Seed' />
      </Page>
    );
  }
}

App.propTypes = {
  className: PropTypes.string,
  hideFooter: PropTypes.bool,
  pageTitle: PropTypes.string,
  children: PropTypes.node
};

function mapStateToProps (state, props) {
  return {};
}

function dispatcher (dispatch) {
  return {};
}

export default connect(
  mapStateToProps,
  dispatcher
)(App);
