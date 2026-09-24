import React from 'react';
import { normalizeError } from '../utils/normalizeError';
import { ErrorContext } from '../context/ErrorContext';

export default class ErrorBoundary extends React.Component {
  static contextType = ErrorContext;

  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    const normalized = normalizeError(error);

    const { showError } = this.context || {};

    if (showError) {
      showError(normalized);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}