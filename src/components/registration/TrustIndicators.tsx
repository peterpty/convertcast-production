'use client';

export function TrustIndicators() {
  return (
    <div className="mb-8">
      {/* Live Statistics */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/30">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="text-center">
            <div className="flex items-center justify-center text-green-600 font-bold text-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              2,847
            </div>
            <div className="text-gray-600 text-xs">Registered</div>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="text-orange-600 font-bold text-lg">1,234</div>
            <div className="text-gray-600 text-xs">Watching Live</div>
          </div>
          <div className="h-8 w-px bg-gray-300"></div>
          <div className="text-center">
            <div className="text-purple-600 font-bold text-lg">98.2%</div>
            <div className="text-gray-600 text-xs">Satisfaction</div>
          </div>
        </div>
      </div>

      {/* Social Proof Messages */}
      <div className="space-y-2">
        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <div className="flex items-center text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-3">
              SJ
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">Sarah J. just registered</p>
              <p className="text-gray-500 text-xs">2 seconds ago</p>
            </div>
            <div className="text-green-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <div className="flex items-center text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-3">
              MK
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">Mike K. from California joined</p>
              <p className="text-gray-500 text-xs">8 seconds ago</p>
            </div>
            <div className="text-green-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
          <div className="flex items-center text-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs mr-3">
              LR
            </div>
            <div className="flex-1">
              <p className="text-gray-800 font-medium">Lisa R. secured her spot</p>
              <p className="text-gray-500 text-xs">15 seconds ago</p>
            </div>
            <div className="text-green-500">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Security Badges */}
      <div className="flex items-center justify-center space-x-4 mt-4">
        <div className="flex items-center text-white/70 text-xs">
          <svg className="w-4 h-4 text-green-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          SSL Secured
        </div>
        <div className="flex items-center text-white/70 text-xs">
          <svg className="w-4 h-4 text-blue-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
          </svg>
          Privacy Protected
        </div>
        <div className="flex items-center text-white/70 text-xs">
          <svg className="w-4 h-4 text-purple-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Instant Access
        </div>
      </div>
    </div>
  );
}