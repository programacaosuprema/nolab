import React from 'react';
import { normalizeError } from './errorHandler';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    const normalized = normalizeError(error);

    this.setState({
      error: normalized,
    });

    if (this.props.showError) {
      this.props.showError(normalized);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: 20,
          }}
        >
          <div>
            <h2>⚠️ Algo deu errado</h2>

            {this.state.error && (
              <>
                <p>
                  <strong>Mensagem:</strong> {this.state.error.message}
                </p>

                {this.state.error.stack && (
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {this.state.error.stack}
                  </pre>
                )}
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
