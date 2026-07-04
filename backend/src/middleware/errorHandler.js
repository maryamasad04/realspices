export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.message
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate entry',
      details: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Not found',
      details: 'The requested resource was not found'
    });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};
