function MobilePreview() {
  return (
    <div className="relative">
      {/* Phone Frame */}
      <div className="bg-[#202020] rounded-[2.5rem] p-2 shadow-2xl" style={{ width: '280px', height: '580px' }}>
        {/* Screen */}
        <div className="bg-[#fafafa] rounded-[2rem] w-full h-full overflow-hidden relative">
          {/* Status Bar */}
          <div className="bg-black px-6 py-2 flex items-center justify-between text-white text-sm">
            <span className="font-semibold">8:30</span>
            <div className="flex items-center space-x-1">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-white rounded-full"></div>
                <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              </div>
              <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2 17h20v2H2zm1.15-4.05L4 11l4 4 4-4 4 4 4-4 1.25 1.95L17 17l-4-4-4 4-4-4z"/>
              </svg>
              <div className="w-6 h-3 border border-white rounded-sm">
                <div className="w-4 h-1.5 bg-white rounded-sm m-0.5"></div>
              </div>
            </div>
          </div>

          {/* App Content */}
          <div className="bg-[#fafafa] h-full px-4 py-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-bold text-[#202020] hebrew-text">Inbox</h1>
              <div className="flex items-center space-x-2">
                <button className="p-1">
                  <svg className="w-5 h-5 text-[#666]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Task Entry */}
            <div className="bg-white rounded-lg p-3 mb-3 shadow-sm border border-[#eee]">
              <div className="flex items-start">
                <div className="w-4 h-4 rounded-full border-2 border-[#ddd] mt-0.5 ml-3 flex-shrink-0"></div>
                <div className="flex-1 ml-3">
                  <div className="text-base text-[#202020] mb-2 hebrew-text">
                    Write agenda for Monday's meeting tomorrow
                  </div>
                  <div className="text-sm text-[#888] mb-2 hebrew-text">Description</div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="bg-[#ff8c00] text-white text-sm px-2 py-1 rounded hebrew-text">
                      Tomorrow
                    </span>
                    <span className="bg-purple-500 text-white text-sm px-2 py-1 rounded hebrew-text">
                      Website Update
                    </span>
                    <span className="text-sm text-[#888] bg-[#f0f0f0] px-2 py-1 rounded">+Paul</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative Elements */}
            <div className="relative flex-1">
              <div className="absolute top-4 right-8 w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="absolute top-12 left-12 w-1 h-1 bg-orange-400 rounded-full"></div>
              <div className="absolute top-20 right-6 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
              <div className="absolute top-28 left-8 w-1 h-1 bg-green-400 rounded-full"></div>
            </div>
          </div>

          {/* Virtual Keyboard */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#e5e5e5] p-3">
            <div className="grid grid-cols-10 gap-1 text-sm text-center mb-1">
              {['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'].map((key) => (
                <div key={key} className="bg-white p-1 rounded text-[#333] font-medium">{key}</div>
              ))}
            </div>
            <div className="grid grid-cols-9 gap-1 text-sm text-center mb-1">
              {['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'].map((key) => (
                <div key={key} className="bg-white p-1 rounded text-[#333] font-medium">{key}</div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="bg-white p-1 rounded text-sm w-20 text-center">
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-20 right-4">
        <button className="bg-[#db4c3f] hover:bg-[#c53030] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default MobilePreview
