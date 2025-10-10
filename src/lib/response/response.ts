export const successResponse = (
  res: any,
  message: string,
  data: any = null,
  statusCode = 200,
) => {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
};

export const errorResponse = (
  res: any,
  message: string,
  statusCode = 500,
  error: any = null,
) => {
  return res.status(statusCode).json({
    status: 'error',
    message,
    error: {
      code: statusCode,
      details: error ? error.message || error : null,
    },
  });
};
