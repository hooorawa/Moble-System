import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '2px solid #f5222d',
          borderRadius: '4px',
          backgroundColor: '#fff1f0',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h2 style={{ color: '#f5222d', margin: '0 0 10px 0' }}>
            Something went wrong
          </h2>
          <p style={{ margin: '10px 0', color: '#666' }}>
            We're sorry for the inconvenience. The application encountered an unexpected error.
          </p>
          {process.env.NODE_ENV !== 'production' && this.state.error && (
            <details style={{
              marginTop: '15px',
              padding: '10px',
              backgroundColor: '#fff',
              borderRadius: '3px',
              borderLeft: '3px solid #f5222d',
              fontSize: '12px'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                Error Details
              </summary>
              <pre style={{
                margin: '10px 0 0 0',
                overflow: 'auto',
                backgroundColor: '#f5f5f5',
                padding: '10px',
                borderRadius: '3px',
                fontSize: '11px'
              }}>
                {this.state.error && this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={this.resetError}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: '#1890ff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#40a9ff'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#1890ff'}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
