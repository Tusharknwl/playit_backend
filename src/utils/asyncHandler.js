// a wrapper for async request handlers to catch errors and pass them to the error handling middleware
const asyncHandler =  (requestHandler) => {
    return async (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
        .catch( (err)=>next(err) )
    }
}

export { asyncHandler }