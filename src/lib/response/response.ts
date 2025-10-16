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
  // 🔧 Bersihkan newline dan spasi berlebih dari pesan
  const cleanMessage = message?.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim();

  // 🔧 Ambil hanya isi error.message (bukan seluruh stack)
  const rawDetails =
    typeof error?.message === 'string'
      ? error.message
      : typeof error === 'string'
        ? error
        : null;

  const cleanDetails = rawDetails
    ? rawDetails.replace(/\s+/g, ' ').replace(/\n/g, ' ').trim()
    : null;

  return res.status(statusCode).json({
    status: 'error',
    message: cleanMessage,
    error: {
      code: statusCode,
      details: cleanDetails,
    },
  });
};
