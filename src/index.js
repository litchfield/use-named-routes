import invariant from 'invariant';
import { formatPattern, matchPattern } from 'react-router/lib/PatternUtils';
import { createRoutes } from 'react-router/lib/RouteUtils';


// From react-router/lib/matchRoutes
// Unfortunately these are not exported :-(

function assignParams(params, paramNames, paramValues) {
  return paramNames.reduce(function (params, paramName, index) {
    var paramValue = paramValues && paramValues[index];

    if (Array.isArray(params[paramName])) {
      params[paramName].push(paramValue);
    } else if (paramName in params) {
      params[paramName] = [params[paramName], paramValue];
    } else {
      params[paramName] = paramValue;
    }

    return params;
  }, params);
}

function createParams(paramNames, paramValues) {
  return assignParams({}, paramNames, paramValues);
}



function makePaths(paths, route, basePath) {
  const { path, name, indexRoute, childRoutes } = route;

  let fullPath;
  if (!path) {
    fullPath = basePath;
  } else if (path[0] === '/') {
    // TODO: This is getting deprecated.
    fullPath = path;
  } else if (basePath[basePath.length - 1] === '/') {
    fullPath = `${basePath}${path}`;
  } else {
    fullPath = `${basePath}/${path}`;
  }

  if (name) {
    /* eslint-disable no-param-reassign */
    paths[name] = fullPath;
    /* eslint-enable no-param-reassign */
  }

  if (indexRoute) {
    makePaths(paths, indexRoute, fullPath);
  }
  if (childRoutes) {
    childRoutes.forEach(childRoute => makePaths(paths, childRoute, fullPath));
  }
}

export function useNamedRoutesHistory(history, routes) {

  const paths = {};
  createRoutes(routes).forEach(route => makePaths(paths, route, '/'));

  function resolveLocation(location) {
    let name;
    if (typeof location === 'string') {
      if (location[0] !== '/') {
        name = location;
      }
    } else {
      name = location.name;
    }
    if (!name) {
      return location;
    }

    const path = paths[name];
    invariant(path, 'Unknown route: %s', name);

    const match = matchPattern(path, history.getCurrentLocation().pathname);

    const params = {
      ...createParams(match.paramNames, match.paramValues),
      ...location.params
    }

    return {
      ...location,
      pathname: formatPattern(path, params),
    };
  }

  function push(location) {
    history.push(resolveLocation(location));
  }

  function replace(location) {
    history.replace(resolveLocation(location));
  }

  function createPath(location) {
    return history.createPath(resolveLocation(location));
  }

  function createHref(location) {
    return history.createHref(resolveLocation(location));
  }

  function createLocation(location, ...args) {
    return history.createLocation(resolveLocation(location), ...args);
  }

  return {
    ...history,
    push,
    replace,
    createPath,
    createHref,
    createLocation,
  };

}

export default function useNamedRoutes(createHistory) {
  return (options = {}) => {

    const history = createHistory(options);

    const { routes } = options;

    return useNamedRoutesHistory(history, routes);

  };
}
