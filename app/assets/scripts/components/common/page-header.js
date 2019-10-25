import React from 'react';
import styled from 'styled-components';
import { PropTypes as T } from 'prop-types';

import { connect } from 'react-redux';
import config from '../../config';
import { wrapApiResult } from '../../redux/utils';
import { Link, NavLink } from 'react-router-dom';
import { themeVal } from '../../styles/utils/general';
import { multiply } from '../../styles/utils/math';
import { stackSkin } from '../../styles/skins';

const PageHead = styled.header`
  ${stackSkin()}
  position: relative;
  z-index: 10;
`;

const PageHeadInner = styled.div`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${themeVal('layout.space')} ${multiply(themeVal('layout.space'), 2)};
  margin: 0 auto;
`;

const PageTitle = styled.h1`
  font-size: 1.25rem;
  line-height: 1.25rem;
  margin: 0;

  a {
    color: inherit;
    display: block;
  }
`;

const PageNav = styled.nav`
  display: flex;
  margin: 0 0 0 auto;
`;

const GlobalMenu = styled.ul`
  display: flex;
  flex-flow: row nowrap;
  justify-content: center;
  margin: 0;
  list-style: none;

  > * {
    margin: 0 0 0 ${multiply(themeVal('layout.space'), 2)};
  }

  a {
    display: block;
    position: relative;
    font-size: 0.875rem;
    line-height: 2rem;
    color: inherit;
    text-transform: uppercase;
    font-weight: ${themeVal('type.base.regular')};
  }

  .active::before {
    position: absolute;
    top: 100%;
    left: 50%;
    width: 1rem;
    height: 1px;
    background: ${themeVal('type.base.color')};
    content: '';
    transform: translate(-50%, 0);
  }
`;

class PageHeader extends React.Component {
  render () {
    let isLogged = false;
    const { isReady, hasError, getData } = this.props.authenticatedUser;
    if (isReady() && !hasError()) {
      const user = getData();
      if (user.osmId) {
        isLogged = true;
      }
    }

    return (
      <PageHead>
        <PageHeadInner>
          <PageTitle>
            <Link to='/' title='Go to Dashboard'>
              {this.props.pageTitle}
            </Link>
          </PageTitle>
          <PageNav>
            <GlobalMenu>
              {config.environment !== 'production' && (
                <li>
                  <NavLink exact to='/sandbox' title='View page'>
                    <span>Sandbox</span>
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink exact to='/about' title='View page'>
                  <span>About</span>
                </NavLink>
              </li>
              {!isLogged ? (
                <li>
                  <NavLink exact to='/login' title='Login page'>
                    <span>Login</span>
                  </NavLink>
                </li>
              ) : (
                <>
                  <li>
                    <NavLink exact to='/traces' title='View page'>
                      <span>Traces</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink exact to='/photos' title='View page'>
                      <span>Photos</span>
                    </NavLink>
                  </li>
                  <li>
                    <NavLink exact to='/logout' title='Logout'>
                      <span>Logout</span>
                    </NavLink>
                  </li>
                </>
              )}
            </GlobalMenu>
          </PageNav>
        </PageHeadInner>
      </PageHead>
    );
  }
}

PageHeader.propTypes = {
  pageTitle: T.string,
  authenticatedUser: T.object
};

function mapStateToProps (state) {
  return {
    authenticatedUser: wrapApiResult(state.authenticatedUser)
  };
}

function dispatcher (dispatch) {
  return {};
}

export default connect(
  mapStateToProps,
  dispatcher
)(PageHeader);
