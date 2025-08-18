import React, { useState } from 'react'
import SearchBox from '../components/UI/SearchBox'
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react'

const FAQPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const faqItems = [
    {
      id: 'setup-accounts',
      category: 'Getting Started',
      question: 'How do I set up Steam accounts?',
      answer: 'Go to the Import Accounts page and click "Add Account" or "Import" to add your Steam accounts. Make sure you have valid Steam credentials and that Steam Guard is properly configured.'
    },
    {
      id: 'proxy-setup',
      category: 'Getting Started',
      question: 'How do I configure proxy servers?',
      answer: 'Navigate to Import Proxy page and add your proxy servers. You can test each proxy before assigning accounts to ensure they are working properly. Always use reliable proxy services to avoid connection issues.'
    },
    {
      id: 'message-limits',
      category: 'Messaging',
      question: 'What are the Steam messaging limits?',
      answer: 'Steam has built-in rate limiting to prevent spam. The application includes configurable delays between messages to respect these limits. Recommended minimum delay is 2-5 seconds between messages.'
    },
    {
      id: 'friend-requests',
      category: 'Social Features',
      question: 'How many friend requests can I send per day?',
      answer: 'Steam limits friend requests to prevent abuse. New accounts have stricter limits than established accounts. Start with small batches and monitor for any restrictions.'
    },
    {
      id: 'account-safety',
      category: 'Security',
      question: 'How can I keep my accounts safe?',
      answer: 'Use high-quality proxies, respect rate limits, enable Steam Guard, and avoid running multiple automation tasks simultaneously on the same account. Regular breaks between activities help maintain account health.'
    },
    {
      id: 'game-hours',
      category: 'Gaming',
      question: 'How does the hour boost feature work?',
      answer: 'The hour boost feature simulates game activity to increase recorded playtime. Use responsibly and avoid boosting too many hours too quickly as this may trigger Steam\'s anti-cheat systems.'
    },
    {
      id: 'multiple-accounts',
      category: 'Account Management',
      question: 'Can I run multiple accounts simultaneously?',
      answer: 'Yes, but each account should use a different proxy server if possible. Monitor all accounts carefully and avoid identical behavior patterns across accounts.'
    },
    {
      id: 'console-errors',
      category: 'Troubleshooting',
      question: 'What do the console error messages mean?',
      answer: 'Console messages are color-coded: green for success, yellow for warnings, red for errors, and blue for info. Check the message details and account names to identify issues.'
    },
    {
      id: 'steam-guard',
      category: 'Security',
      question: 'How do I handle Steam Guard authentication?',
      answer: 'Steam Guard codes need to be entered manually for each account login. Consider using accounts with mobile authenticator for easier management, but always prioritize security.'
    },
    {
      id: 'banned-accounts',
      category: 'Troubleshooting',
      question: 'What should I do if an account gets restricted?',
      answer: 'Stop all automation on the restricted account immediately. Review your automation settings, reduce activity frequency, and ensure you\'re following Steam\'s Terms of Service. Consider contacting Steam Support if needed.'
    },
    {
      id: 'proxy-issues',
      category: 'Troubleshooting',
      question: 'My proxy keeps disconnecting, what should I do?',
      answer: 'Check proxy server status, verify credentials, and test connection. Consider switching to a different proxy server or contacting your proxy provider. Poor proxy quality can lead to account issues.'
    },
    {
      id: 'settings-backup',
      category: 'Configuration',
      question: 'How do I backup my settings and accounts?',
      answer: 'Use the Export functions in the Accounts and Proxy pages to save your configurations. Regularly backup your settings to avoid losing your setup. Never commit sensitive data to version control.'
    }
  ]

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const filteredItems = faqItems.filter(item => 
    searchTerm === '' ||
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = [...new Set(filteredItems.map(item => item.category))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <HelpCircle size={24} className="text-steam-green" />
          <h1 className="text-2xl font-bold text-white">Frequently Asked Questions</h1>
        </div>
        <div className="text-sm text-gray-300">
          {filteredItems.length} of {faqItems.length} questions
        </div>
      </div>

      <SearchBox
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search FAQ by question, answer, or category..."
        className="max-w-md"
      />

      <div className="space-y-6">
        {categories.map(category => {
          const categoryItems = filteredItems.filter(item => item.category === category)
          
          return (
            <div key={category}>
              <h3 className="text-lg font-medium text-steam-green mb-4">{category}</h3>
              
              <div className="space-y-2">
                {categoryItems.map(item => {
                  const isExpanded = expandedItems.includes(item.id)
                  
                  return (
                    <div
                      key={item.id}
                      className="bg-steam-lightblue/20 border border-steam-lightblue rounded-lg overflow-hidden"
                    >
                      <button
                        onClick={() => toggleExpanded(item.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-steam-lightblue/30 transition-colors"
                      >
                        <span className="font-medium text-white">{item.question}</span>
                        {isExpanded ? (
                          <ChevronDown size={20} className="text-gray-400 shrink-0 ml-2" />
                        ) : (
                          <ChevronRight size={20} className="text-gray-400 shrink-0 ml-2" />
                        )}
                      </button>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-steam-lightblue/30">
                          <p className="text-gray-300 leading-relaxed mt-3">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {filteredItems.length === 0 && searchTerm && (
        <div className="text-center py-12 text-gray-400">
          <HelpCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg mb-2">No FAQ items found</p>
          <p className="text-sm">Try adjusting your search terms</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-steam-lightblue/20 border border-steam-lightblue rounded-lg">
        <div className="flex items-start space-x-2">
          <HelpCircle size={20} className="text-steam-green shrink-0 mt-0.5" />
          <div>
            <h5 className="font-medium text-white mb-1">Need More Help?</h5>
            <p className="text-sm text-gray-300">
              If you can't find the answer to your question here, check the documentation or contact support. 
              Always follow Steam's Terms of Service when using automation features.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FAQPage
