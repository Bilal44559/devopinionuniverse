

APIs

*APIs Base URL* : http://153.92.211.165:3000
*Image Base URL* : http://153.92.211.165:3000

**Note** :
    Validation apply on all form
    complete validation
    complete error validation messages
    complete error and success messages toster on apis response

*Sample Login Detail* : 
        *email_address* : bilal@gmail.com
        *password* : 123123123

-------------------------------------------------
*************************************************

            02-10-2024  (Wednesday)
__________________________________________________________________

*End Point*  : /auth/signup-step-four
*Method* : post
*Parameters* :
    agreement ==> File (form body)
    email_address
___________________________________________________________________

*End Point*  : /auth/signup-step-five
*Method* : post
*Parameters* :
    signature_image ==> File (form body)
    email_address
    user_designation
___________________________________________________________________

*End Point*  : /auth/login
*Method* : post
*Parameters* :
    email_address
    password
___________________________________________________________________

*End Point*  : /publisher/account-detail
*Method* : Get
*Headers* : Token
___________________________________________________________________

*End Point*  : /publisher/company-detail
*Method* : Post
*Headers* : Token
*Parameters* :
    {
        "c_first_name" : "tested",
        "c_last_name" : "task co.ltd",
        "company_name" : "tested inc.",
        "c_tax_number" : "09090909090",
        "c_country" : "USA",
        "c_city" : "BBC",
        "c_zip" : "221122",
        "c_address" : "XXXYZ",
        "c_telegram" : "Telegram",
        "c_phone" : "0011223344",
        "c_skype" : "Skype",
        "currency" : "PKR",
        "currency_type" : "Invoice Payment"
    }

___________________________________________________________________

*End Point*  : /publisher/payment-detail
*Method* : Post
*Headers* : Token
*Parameters* :
        PayPal
            {
                "email_address" : "test1@gmail.com",
                "payment_method" : "paypal",
                "payment_method_details" : "bilal12@gmail.com",
                "payment_cycle" : "net123"
            }

        Wire Transfer WW 
            {
                "email_address" : "test1@gmail.com",
                "payment_method" : "wire_transfer",
                "payment_method_details" : "42424242424242",
                "pm_bank_owner" : "Bilal",
                "pm_bank_name" : "HBL",
                "pm_bank_address" : "Gujranwala",
                "pm_wire_swift_code" : "1234512345",
                "pm_wire_iban_no" : "090909090",
                "payment_cycle" : "net123"
            }
        
        Bank Transfer Only India
            {
                "payment_method" : "bank_transfer",
                "payment_method_details" : "44444442222222",
                "pm_bank_owner" : "tester",
                "pm_bank_name" : "INB",
                "pm_bank_address" : "India",
                "pm_bank_ifsc" : "1234512345",
                "payment_cycle" : "net123"
            }

___________________________________________________________________

*End Point*  : /publisher/update-password
*Method* : Post
*Headers* : Token
*Parameters* :
    {
        "password" : "123123123",
        "new_password" : "password123",
        "password_confirm" : "password123"
    }

___________________________________________________________________
                   

-------------------------------------------------
*************************************************

            03-10-2024  (Thursday)
______________________________________________________________________

*End Point*  : /publisher/createApp
*Method* : post
*Headers* : Token
*Parameters* :
        {
            "app_name" : "test",
            "website_url" : "www.test.com"
        }

____________________________________________________________________

*End Point*  : /publisher/getApp
*Method* : get
*Headers* : Token
____________________________________________________________________

*End Point*  : /publisher/updateApp
*Method* : post
*Headers* : Token
*Parameters* :
        {
            "appId" : "66b9f136f00a455153dccdf8",
            "app_name" : "Tester",
            "website_url" : "https//:www.tester.com"
        }
____________________________________________________________________


*End Point*  : /publisher/deleteApp
*Method* : post
*Headers* : Token
*Parameters* :
        {
            "appId" : "66b9efc20b4f2c875133414f"
        }

____________________________________________________________________

-------------------------------------------------
*************************************************

            04-10-2024  (Friday)
____________________________________________________________________

*End Point*  : /publisher/getAllOffers
*Method* :Post
*Headers* : Token
*Parameters* :
    {
        "page" : 1
    }

___________________________________________________________________

*End Point*  : /publisher/getSingleOffers
*Method* : Post
*Headers* : Token
*Parameters* :
    {
        "offer_id" : "66d1bb596cc6f85e7bdf9b7a"
    }

___________________________________________________________________

*End Point*  : /publisher/searchOffers
*Method* : post
*Headers* : Token
*Parameters* :
    {
        "page": 10,
        "search":1157901,
        "countries" : ["US"],   ==>   array multiple values
        "browsers" : ["iPad", "iPhone"]   ==>   array multiple values
    }

____________________________________________________________________
